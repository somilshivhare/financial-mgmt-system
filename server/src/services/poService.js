const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const normalizeBusinessUnit = (bu) => {
  const cleaned = String(bu || 'MAIN')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned || 'MAIN';
};

const getFinancialYearConcat = (dateLike = null) => {
  const d = dateLike ? new Date(dateLike) : new Date();
  const dt = Number.isNaN(d.getTime()) ? new Date() : d;
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}${endYear}`;
};

const needsGeneratedPONumber = (poNumber) => {
  if (!poNumber) return true;
  const s = String(poNumber).trim().toUpperCase();
  return s.includes('XXXX') || s.endsWith('-XXXX');
};

const normalizePOStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  const allowed = new Set(['draft', 'approved', 'closed', 'cancelled']);
  return allowed.has(s) ? s : null;
};

/** mysql2 often returns JSON columns as already-parsed objects; avoid JSON.parse(object.toString()). */
const parsePODraftDataColumn = (raw) => {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string') {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  if (Buffer.isBuffer(raw)) {
    try {
      const str = raw.toString('utf8');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') {
    return raw;
  }
  return null;
};

const createHttpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

const generateNextPONumber = async (businessUnit, poDateLike = null) => {
  const bu = normalizeBusinessUnit(businessUnit);
  const fy = getFinancialYearConcat(poDateLike);

  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT counter FROM po_number_counter WHERE business_unit = ? AND financial_year = ? FOR UPDATE',
      [bu, fy],
    );

    let counter = 0;
    if (!rows || rows.length === 0) {
      await conn.execute(
        'INSERT INTO po_number_counter (business_unit, financial_year, counter) VALUES (?, ?, 0)',
        [bu, fy],
      );
    } else {
      counter = Number(rows[0].counter) || 0;
    }

    counter += 1;
    await conn.execute(
      'UPDATE po_number_counter SET counter = ?, updated_at = NOW() WHERE business_unit = ? AND financial_year = ?',
      [counter, bu, fy],
    );

    return `PO-${bu}-${fy}-${String(counter).padStart(4, '0')}`;
  });
};

const canViewAllPOs = (role) => {
  const adminRoles = ['admin', 'operations', 'finance'];
  return adminRoles.includes(String(role || '').toLowerCase());
};

const listPOs = async ({ page = 1, pageSize = 20, status, q, userId, role }) => {
  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(1000, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (pageNum - 1) * pageSizeNum;
    const where = [];
    const params = [];
    
    const canViewAll = canViewAllPOs(role);
    
    console.log('[PO Service] listPOs called:', {
      userId: userId ? `${userId.substring(0, 8)}...` : 'MISSING',
      role: role || 'MISSING',
      canViewAll,
      status,
      q: q ? `${q.substring(0, 20)}...` : null
    });
    
    if (!canViewAll) {
      if (!userId || String(userId).trim() === '') {
        console.error('[PO Service] Security violation: Non-admin user attempted to list POs without userId');
        throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to list purchase orders');
      }
      where.push('created_by = ?');
      params.push(String(userId).trim());
      console.log('[PO Service] Filtering by userId:', userId.substring(0, 8) + '...');
    } else {
      console.log('[PO Service] Admin/operations/finance role detected - showing all POs');
    }
    
    if (status != null && String(status).trim() !== '') {
      where.push('status = ?');
      params.push(String(status).trim());
    }
    if (q != null && String(q).trim() !== '') {
      where.push('po_number LIKE ?');
      params.push(`%${String(q).trim()}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const data = await query(
      `SELECT * FROM purchase_orders ${whereSql} ORDER BY created_at DESC LIMIT ${pageSizeNum} OFFSET ${offset}`,
      params,
    );
    const countResult = await query(`SELECT COUNT(*) as total FROM purchase_orders ${whereSql}`, params);
    const total = countResult && countResult[0] ? Number(countResult[0].total) : 0;
    return { data: data || [], page: pageNum, pageSize: pageSizeNum, total };
  } catch (err) {
    if (err.status === 403 || err.code === 'ERR_FORBIDDEN') {
      throw err;
    }
    console.error('[PO Service] Error listing POs:', err.message);
    throw err;
  }
};

const createPO = async (payload, userId) =>
  transaction(async (conn) => {
    const poId = uuidv4();
    await conn.execute(
      `INSERT INTO purchase_orders (id, po_number, customer_id, status, currency, issue_date, due_date, total_amount, created_by)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, 0, ?)`,
      [poId, payload.poNumber, payload.customerId, payload.currency || 'USD', payload.issueDate || null, payload.dueDate || null, userId],
    );

    let total = 0;
    for (const line of payload.lines) {
      const lineId = uuidv4();
      await conn.execute(
        `INSERT INTO purchase_order_lines (id, po_id, line_number, description, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [lineId, poId, line.lineNumber, line.description, line.productId || null, line.quantity, line.unitPrice],
      );
      total += line.quantity * line.unitPrice;
    }
    await conn.execute('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [total, poId]);
    const [poRows] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
    const po = poRows[0];
    
    setImmediate(async () => {
      try {
        const notificationService = require('./notificationService');
        const websocketService = require('./websocketService');
        const notifications = await notificationService.notifyPOCreated(po, userId);
        
        notifications.forEach(notif => {
          if (notif.user_id) {
            websocketService.sendNotificationToUser(notif.user_id, notif);
          }
        });
      } catch (err) {
        console.error('Error sending PO creation notification:', err);
      }
    });
    
    return po;
  });

const getPO = async (poId, userId = null, role = null) => {
  const [po] = await query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
  if (!po) return null;
  
  if (!canViewAllPOs(role)) {
    if (!userId || String(userId).trim() === '') {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to access purchase orders');
    }
    if (po.created_by !== String(userId).trim()) {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this PO');
    }
  }

  if (po.draft_data) {
    const parsed = parsePODraftDataColumn(po.draft_data);
    if (parsed && typeof parsed.formData === 'object' && parsed.formData !== null) {
      po.formData = parsed.formData;
      po.boqItems = Array.isArray(parsed.boqItems) ? parsed.boqItems : [];
    } else if (parsed && Array.isArray(parsed.boqItems)) {
      po.boqItems = parsed.boqItems;
    }
  }

  if (!po.boqItems || po.boqItems.length === 0) {
    const lines = await query('SELECT * FROM purchase_order_lines WHERE po_id = ? ORDER BY line_number', [po.id]);
    po.boqItems = (lines || []).map((line, index) => ({
      id: index + 1,
      materialDescription: line.description || '',
      quantity: line.quantity || '',
      uom: '',
      unitPrice: line.unit_price || '',
      unitCost: '',
      freight: '',
      gst: '',
      totalCost: line.subtotal || '',
    }));
  }

  return po;
};

const getPONumbers = async (userId = null, role = null) => {
  const where = [];
  const params = [];
  
  if (!canViewAllPOs(role)) {
    if (!userId || String(userId).trim() === '') {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to access purchase orders');
    }
    where.push('created_by = ?');
    params.push(String(userId).trim());
  }
  
  where.push("status IN ('approved', 'closed')");
  const whereSql = `WHERE ${where.join(' AND ')}`;
  
  const rows = await query(
    `SELECT id, po_number FROM purchase_orders ${whereSql} ORDER BY po_number ASC`,
    params
  );
  return rows || [];
};

const getPOByNumber = async (poNumber, userId = null, role = null) => {
  const where = ['po_number = ?'];
  const params = [poNumber];
  
  if (!canViewAllPOs(role)) {
    if (!userId || String(userId).trim() === '') {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to access purchase orders');
    }
    where.push('created_by = ?');
    params.push(String(userId).trim());
  }
  
  const rows = await query(
    `SELECT * FROM purchase_orders WHERE ${where.join(' AND ')} ORDER BY FIELD(status, 'approved', 'closed') DESC, updated_at DESC LIMIT 1`,
    params
  );
  const row = rows && rows[0];
  if (!row) return null;
  return getPO(row.id, userId, role);
};

const getLatestDraftPO = async (userId) => {
  const [po] = await query(
    'SELECT * FROM purchase_orders WHERE created_by = ? AND status = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1',
    [userId, 'draft']
  );
  return po || null;
};

const updateStatus = async (poId, status, userId) => {
  await query('UPDATE purchase_orders SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?', [
    status,
    userId,
    poId,
  ]);
  const [po] = await query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
  
  setImmediate(async () => {
    try {
      const notificationService = require('./notificationService');
      const websocketService = require('./websocketService');
      let notifications = [];
      
      if (status === 'approved') {
        notifications = await notificationService.notifyPOApproved(po, userId);
      } else if (status === 'draft') {
        notifications = await notificationService.notifyPOApprovalPending(po);
      }
      
      notifications.forEach(notif => {
        if (notif.user_id) {
          websocketService.sendNotificationToUser(notif.user_id, notif);
        }
      });
    } catch (err) {
      console.error('Error sending PO status notification:', err);
    }
  });
  
  return po;
};

const upsertPODraft = async (formData, userId, poId = null) => {
  
  let existingPO = null;
  if (poId) {
    try {
      existingPO = await getPO(poId, userId, null);
    } catch (err) {
      if (err.status === 403) {
        throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this PO');
      }
      throw err;
    }
  }
  if (!existingPO && formData.id) {
    try {
      existingPO = await getPO(formData.id, userId, null);
    } catch (err) {
      if (err.status === 403) {
        throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this PO');
      }
      throw err;
    }
  }
  if (!existingPO && formData.poNumber) {
    try {
      existingPO = await getPOByNumber(formData.poNumber, userId, null);
    } catch (err) {
      if (err.status === 403) {
        throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this PO');
      }
      throw err;
    }
  }
  
  if (existingPO && userId && !canViewAllPOs(null) && existingPO.created_by !== userId) {
    throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to modify this PO');
  }
  
  const customerId = formData.customerId || formData.customer_id || null;
  if (!existingPO && (!customerId || String(customerId).trim() === '')) {
    throw createHttpError(400, 'ERR_VALIDATION', 'Customer is required. Please select a customer before saving the draft.');
  }
  
  const boqItems = formData.boqItems || [];
  delete formData.boqItems; // Remove from main form data
  
  const cleanFormData = Object.entries(formData).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const requestedStatus = normalizePOStatus(cleanFormData.status || formData.status);

  const shouldGenerateNumber = needsGeneratedPONumber(cleanFormData.poNumber);
  
  let generatedPoNumber = null;
  if (shouldGenerateNumber) {
    generatedPoNumber = await generateNextPONumber(cleanFormData.businessUnit || 'MAIN', cleanFormData.poDate || null);
    cleanFormData.poNumber = generatedPoNumber;
  }

  const finalPoNumber = String(cleanFormData.poNumber || '').trim();
  if (finalPoNumber) {
    const dupRows = await query(
      'SELECT id FROM purchase_orders WHERE po_number = ? LIMIT 1',
      [finalPoNumber],
    );
    if (dupRows && dupRows.length > 0) {
      const dupId = dupRows[0].id;
      if (!existingPO || String(dupId) !== String(existingPO.id)) {
        throw createHttpError(400, 'ERR_DUPLICATE_PO', 'This PO number already exists. Enter a different sequence (suffix).');
      }
    }
  }

  const draftDataJson = JSON.stringify({
    formData: cleanFormData,
    boqItems: boqItems,
    savedAt: new Date().toISOString(),
  });

  let totalFromDraft = parseFloat(cleanFormData.poValue) || 0;
  if (!Number.isFinite(totalFromDraft) || totalFromDraft <= 0) {
    totalFromDraft = (boqItems || []).reduce(
      (sum, it) => sum + (parseFloat(it.totalCost) || 0),
      0
    );
  }
  
  if (existingPO) {
    const existingNeedsUpgrade =
      needsGeneratedPONumber(existingPO.po_number) || needsGeneratedPONumber(existingPO.poNumber);

    if (existingNeedsUpgrade && generatedPoNumber) {
      await query(
        `UPDATE purchase_orders
         SET po_number = ?, draft_data = ?, updated_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [generatedPoNumber, draftDataJson, userId, existingPO.id],
      );
    }

    try {
      await query(
        `UPDATE purchase_orders 
         SET draft_data = ?, total_amount = COALESCE(NULLIF(?, 0), total_amount), status = COALESCE(?, status), updated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [draftDataJson, totalFromDraft, requestedStatus, userId, existingPO.id]
      );
    } catch (err) {
      await query(
        `UPDATE purchase_orders 
         SET customer_id = COALESCE(?, customer_id), po_number = ?, currency = ?, status = COALESCE(?, status), updated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          customerId || existingPO.customer_id, // Use validated customerId or preserve existing
          cleanFormData.poNumber || existingPO.po_number,
          formData.poCurrency || existingPO.currency || 'INR',
          requestedStatus,
          userId,
          existingPO.id,
        ]
      );
    }
    
    if (boqItems.length > 0) {
      await query('DELETE FROM purchase_order_lines WHERE po_id = ?', [existingPO.id]);
      
      let total = 0;
      let lineNumber = 1;
      for (const item of boqItems) {
        if (item.materialDescription && item.quantity && item.unitPrice) {
          const lineId = uuidv4();
          const validLineNumber = Number.isInteger(item.lineNumber) ? item.lineNumber : lineNumber;
          await query(
            `INSERT INTO purchase_order_lines (id, po_id, line_number, description, quantity, unit_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              lineId, 
              existingPO.id, 
              validLineNumber, 
              String(item.materialDescription || ''), 
              parseFloat(item.quantity) || 0, 
              parseFloat(item.unitPrice) || 0
            ]
          );
          total += (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
          lineNumber++;
        }
      }
      
      await query('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [total, existingPO.id]);
    }
    
    return getPO(existingPO.id, userId, null); // userId already validated, role not needed for own PO
  } else {
    const newPoId = poId || uuidv4();
    const poNumber = cleanFormData.poNumber || `PO-${Date.now()}`;
    const initialStatus = requestedStatus || 'draft';
    
    await query(
      `INSERT INTO purchase_orders (id, po_number, customer_id, status, currency, issue_date, due_date, total_amount, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        newPoId,
        poNumber,
        customerId, // Already validated - cannot be null for new PO
        initialStatus,
        formData.poCurrency || 'INR',
        formData.poDate || null,
        formData.lastDateOfDelivery || null,
        userId,
        userId,
      ]
    );
    
    try {
      await query(
        `UPDATE purchase_orders SET draft_data = ?, total_amount = ? WHERE id = ?`,
        [draftDataJson, totalFromDraft || 0, newPoId]
      );
    } catch (err) {
      console.warn('[PO Service] draft_data column not found, skipping JSON storage');
    }
    
    if (boqItems.length > 0) {
      let total = 0;
      for (const item of boqItems) {
        if (item.materialDescription && item.quantity && item.unitPrice) {
          const lineId = uuidv4();
          await query(
            `INSERT INTO purchase_order_lines (id, po_id, line_number, description, quantity, unit_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [lineId, newPoId, item.id || 1, item.materialDescription, parseFloat(item.quantity) || 0, parseFloat(item.unitPrice) || 0]
          );
          total += (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
        }
      }
      
      await query('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [total, newPoId]);
    }
    
    return getPO(newPoId, userId, null); // userId already validated, role not needed for own PO
  }
};

const getPODraft = async (poId = null, userId = null, role = null) => {
  let po = null;
  
  if (poId) {
    po = await getPO(poId, userId, role);
  } else if (userId) {
    po = await getLatestDraftPO(userId);
  }
  
  if (!po) return null;
  
  if (!canViewAllPOs(role)) {
    if (!userId || String(userId).trim() === '') {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to access purchase order drafts');
    }
    if (po.created_by !== String(userId).trim()) {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this draft');
    }
  }
  
  let draftData = null;
  try {
    const [result] = await query('SELECT draft_data FROM purchase_orders WHERE id = ?', [po.id]);
    if (result && result.draft_data) {
      draftData = typeof result.draft_data === 'string' ? JSON.parse(result.draft_data) : result.draft_data;
    }
  } catch (err) {
  }
  
  const lines = await query('SELECT * FROM purchase_order_lines WHERE po_id = ? ORDER BY line_number', [po.id]);
  
  const boqItems = lines.map((line, index) => ({
    id: index + 1,
    materialDescription: line.description || '',
    quantity: line.quantity || '',
    uom: '', // Not in DB schema
    unitPrice: line.unit_price || '',
    unitCost: '', // Not in DB schema
    freight: '', // Not in DB schema
    gst: '', // Not in DB schema
    totalCost: line.subtotal || '',
  }));
  
  if (draftData && draftData.formData) {
    return {
      ...draftData.formData,
      boqItems: draftData.boqItems || boqItems,
      id: po.id,
      poNumber: po.po_number,
    };
  }
  
  return {
    id: po.id,
    poNumber: po.po_number,
    customerId: po.customer_id,
    poCurrency: po.currency,
    poDate: po.issue_date,
    lastDateOfDelivery: po.due_date,
    boqItems: boqItems,
  };
};

const deletePO = async (poId, userId = null, role = null) => {
  const existing = await getPO(poId, userId, role);
  if (!existing) return null;

  await query('DELETE FROM purchase_orders WHERE id = ?', [poId]);
  return { id: poId };
};

module.exports = { 
  listPOs, 
  createPO, 
  updateStatus, 
  getPO, 
  getPONumbers, 
  getPOByNumber, 
  getLatestDraftPO,
  upsertPODraft,
  getPODraft,
  deletePO,
};

