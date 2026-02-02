const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const normalizeBusinessUnit = (bu) => {
  const cleaned = String(bu || 'MAIN')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned || 'MAIN';
};

// Financial year uses April–March cycle and is formatted as 20252026 (no dash)
const getFinancialYearConcat = (dateLike = null) => {
  const d = dateLike ? new Date(dateLike) : new Date();
  // If invalid date, fallback to now
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

const createHttpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

/**
 * Generate next PO number (transaction-safe)
 * Format: PO-{BU}-{FY}-{NNNN}
 */
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

/**
 * Check if user role has admin/operations privileges (can see all POs)
 */
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
    
    // CRITICAL: Enforce user-level data isolation
    // Regular users can only see POs they created
    // Admin/operations/finance roles can see all POs
    // PRODUCTION FIX: Require userId for non-admin users to prevent data leakage
    const canViewAll = canViewAllPOs(role);
    
    // PRODUCTION DEBUG: Log role and filtering decision
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
    // IMPORTANT: Some MySQL/MariaDB setups error with bound params in LIMIT/OFFSET.
    // We safely interpolate sanitized integers instead (pageSizeNum/offset are clamped ints).
    const data = await query(
      `SELECT * FROM purchase_orders ${whereSql} ORDER BY created_at DESC LIMIT ${pageSizeNum} OFFSET ${offset}`,
      params,
    );
    const countResult = await query(`SELECT COUNT(*) as total FROM purchase_orders ${whereSql}`, params);
    const total = countResult && countResult[0] ? Number(countResult[0].total) : 0;
    return { data: data || [], page: pageNum, pageSize: pageSizeNum, total };
  } catch (err) {
    // PRODUCTION FIX: Don't swallow authorization errors - let them propagate
    if (err.status === 403 || err.code === 'ERR_FORBIDDEN') {
      throw err;
    }
    console.error('[PO Service] Error listing POs:', err.message);
    // Re-throw database errors instead of silently returning empty data
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
    
    // Trigger notification after transaction commits
    setImmediate(async () => {
      try {
        const notificationService = require('./notificationService');
        const websocketService = require('./websocketService');
        const notifications = await notificationService.notifyPOCreated(po, userId);
        
        // Send via WebSocket
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

/**
 * Get PO by id. When draft_data exists, parses it and attaches formData + boqItems
 * so the client can use this for edit without a separate draft call.
 * 
 * @param {string} poId - PO ID
 * @param {string} userId - Authenticated user ID
 * @param {string} role - User role for authorization check
 * @returns {Promise<Object|null>} PO object or null if not found/unauthorized
 */
const getPO = async (poId, userId = null, role = null) => {
  const [po] = await query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
  if (!po) return null;
  
  // CRITICAL: Enforce authorization - users can only access their own POs unless admin/operations
  // PRODUCTION FIX: Require userId for non-admin users to prevent unauthorized access
  if (!canViewAllPOs(role)) {
    if (!userId || String(userId).trim() === '') {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to access purchase orders');
    }
    if (po.created_by !== String(userId).trim()) {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this PO');
    }
  }

  if (po.draft_data) {
    try {
      const raw = po.draft_data;
      const str = typeof raw === 'string' ? raw : (raw && typeof raw.toString === 'function' ? raw.toString() : '');
      const parsed = str ? JSON.parse(str) : null;
      if (parsed && typeof parsed.formData === 'object') {
        po.formData = parsed.formData;
        po.boqItems = Array.isArray(parsed.boqItems) ? parsed.boqItems : [];
      }
    } catch (err) {
      // ignore parse error
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

/** 
 * Return list of PO numbers for dropdowns (id + po_number). Only approved/closed POs so invoice creation uses valid POs.
 * 
 * @param {string} userId - Authenticated user ID
 * @param {string} role - User role for authorization check
 * @returns {Promise<Array>} Array of PO objects with id and po_number
 */
const getPONumbers = async (userId = null, role = null) => {
  const where = [];
  const params = [];
  
  // CRITICAL: Enforce user-level data isolation
  // PRODUCTION FIX: Require userId for non-admin users to prevent data leakage
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

/**
 * Get PO by po_number. Returns same shape as getPO (with formData/boqItems).
 * When multiple POs share the same po_number, prefers approved/closed so invoice flow gets the valid PO.
 * 
 * @param {string} poNumber - PO number
 * @param {string} userId - Authenticated user ID
 * @param {string} role - User role for authorization check
 * @returns {Promise<Object|null>} PO object or null if not found/unauthorized
 */
const getPOByNumber = async (poNumber, userId = null, role = null) => {
  const where = ['po_number = ?'];
  const params = [poNumber];
  
  // CRITICAL: Enforce user-level data isolation
  // PRODUCTION FIX: Require userId for non-admin users to prevent data leakage
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
  
  // Trigger notifications based on status change
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
      
      // Send via WebSocket
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

/**
 * Upsert PO draft - Insert if new, Update if exists
 * Stores full form data as JSON in draft_data column
 */
const upsertPODraft = async (formData, userId, poId = null) => {
  // Check if we need to add draft_data column (for migration compatibility)
  // For now, we'll use a separate approach - store in a JSON column if it exists
  
  // Resolve existing PO: by URL poId, then by body id (so Submit updates same row after Save Draft), then by poNumber
  // Single lifecycle: draft → submitted; never create a second row when client sends an existing id
  // PRODUCTION FIX: Pass userId/role to enforce authorization checks on internal calls
  let existingPO = null;
  if (poId) {
    try {
      existingPO = await getPO(poId, userId, null);
    } catch (err) {
      // If authorization fails, treat as not found (user cannot access this PO)
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
  
  // PRODUCTION FIX: Additional security check - ensure user owns the PO they're trying to update
  if (existingPO && userId && !canViewAllPOs(null) && existingPO.created_by !== userId) {
    throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to modify this PO');
  }
  
  // Validate customer_id for new PO creation (required field)
  // For existing PO updates, customer_id can be omitted (will preserve existing value)
  const customerId = formData.customerId || formData.customer_id || null;
  if (!existingPO && (!customerId || String(customerId).trim() === '')) {
    throw createHttpError(400, 'ERR_VALIDATION', 'Customer is required. Please select a customer before saving the draft.');
  }
  
  // Extract BOQ items if present
  const boqItems = formData.boqItems || [];
  delete formData.boqItems; // Remove from main form data
  
  // Clean form data (remove undefined values)
  const cleanFormData = Object.entries(formData).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  // Determine requested status (Submit sends "approved")
  const requestedStatus = normalizePOStatus(cleanFormData.status || formData.status);

  // If PO number is missing/placeholder, generate a real one (0001, 0002...) on the server
  const shouldGenerateNumber = needsGeneratedPONumber(cleanFormData.poNumber);
  
  // We'll inject the generated poNumber into draft_data.formData so UI shows the correct value
  let generatedPoNumber = null;
  if (shouldGenerateNumber) {
    generatedPoNumber = await generateNextPONumber(cleanFormData.businessUnit || 'MAIN', cleanFormData.poDate || null);
    cleanFormData.poNumber = generatedPoNumber;
  }
  
  const draftDataJson = JSON.stringify({
    formData: cleanFormData,
    boqItems: boqItems,
    savedAt: new Date().toISOString(),
  });

  // Compute total for list display: formData.poValue or sum(boqItems.totalCost)
  let totalFromDraft = parseFloat(cleanFormData.poValue) || 0;
  if (!Number.isFinite(totalFromDraft) || totalFromDraft <= 0) {
    totalFromDraft = (boqItems || []).reduce(
      (sum, it) => sum + (parseFloat(it.totalCost) || 0),
      0
    );
  }
  
  if (existingPO) {
    // If this PO was previously saved with XXXX, upgrade it to the real sequential number
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

    // Update existing PO (draft_data + total_amount + optional status)
    try {
      await query(
        `UPDATE purchase_orders 
         SET draft_data = ?, total_amount = COALESCE(NULLIF(?, 0), total_amount), status = COALESCE(?, status), updated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [draftDataJson, totalFromDraft, requestedStatus, userId, existingPO.id]
      );
    } catch (err) {
      // If draft_data column doesn't exist, create a migration entry
      // For now, update basic fields
      // For updates, preserve existing customer_id if new one is not provided
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
    
    // Update BOQ lines if provided
    if (boqItems.length > 0) {
      // Delete existing lines
      await query('DELETE FROM purchase_order_lines WHERE po_id = ?', [existingPO.id]);
      
      // Insert new lines
      let total = 0;
      let lineNumber = 1;
      for (const item of boqItems) {
        if (item.materialDescription && item.quantity && item.unitPrice) {
          const lineId = uuidv4();
          // Ensure line_number is a valid integer
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
      
      // Update total
      await query('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [total, existingPO.id]);
    }
    
    return getPO(existingPO.id, userId, null); // userId already validated, role not needed for own PO
  } else {
    // Create new PO
    // customerId is already validated above (required for new PO)
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
    
    // Try to add draft_data and total_amount for list display
    try {
      await query(
        `UPDATE purchase_orders SET draft_data = ?, total_amount = ? WHERE id = ?`,
        [draftDataJson, totalFromDraft || 0, newPoId]
      );
    } catch (err) {
      // Column doesn't exist yet, that's okay
      console.warn('[PO Service] draft_data column not found, skipping JSON storage');
    }
    
    // Add BOQ lines if provided
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

/**
 * Get PO draft data (form data + BOQ items)
 * 
 * @param {string|null} poId - PO ID (optional)
 * @param {string} userId - Authenticated user ID (required)
 * @param {string} role - User role for authorization check
 * @returns {Promise<Object|null>} PO draft object or null if not found/unauthorized
 */
const getPODraft = async (poId = null, userId = null, role = null) => {
  let po = null;
  
  if (poId) {
    po = await getPO(poId, userId, role);
  } else if (userId) {
    po = await getLatestDraftPO(userId);
  }
  
  if (!po) return null;
  
  // CRITICAL: Additional authorization check for drafts
  // Users can only access their own drafts unless admin/operations
  // PRODUCTION FIX: Require userId for non-admin users
  if (!canViewAllPOs(role)) {
    if (!userId || String(userId).trim() === '') {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'User ID is required to access purchase order drafts');
    }
    if (po.created_by !== String(userId).trim()) {
      throw createHttpError(403, 'ERR_FORBIDDEN', 'You do not have permission to access this draft');
    }
  }
  
  // Try to get draft_data JSON
  let draftData = null;
  try {
    const [result] = await query('SELECT draft_data FROM purchase_orders WHERE id = ?', [po.id]);
    if (result && result.draft_data) {
      draftData = typeof result.draft_data === 'string' ? JSON.parse(result.draft_data) : result.draft_data;
    }
  } catch (err) {
    // Column doesn't exist or JSON parse failed
  }
  
  // Get BOQ lines
  const lines = await query('SELECT * FROM purchase_order_lines WHERE po_id = ? ORDER BY line_number', [po.id]);
  
  // Transform lines to BOQ format
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
  
  // If we have draft_data, use it; otherwise reconstruct from DB fields
  if (draftData && draftData.formData) {
    return {
      ...draftData.formData,
      boqItems: draftData.boqItems || boqItems,
      id: po.id,
      poNumber: po.po_number,
    };
  }
  
  // Reconstruct from DB fields (basic fields only)
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

/**
 * Delete PO (cascades to lines/history via FK constraints)
 * 
 * @param {string} poId - PO ID
 * @param {string} userId - Authenticated user ID
 * @param {string} role - User role for authorization check
 * @returns {Promise<Object|null>} Deleted PO object or null if not found/unauthorized
 */
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

