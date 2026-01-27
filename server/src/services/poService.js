const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const listPOs = async ({ page = 1, pageSize = 20, status, q }) => {
  const offset = (page - 1) * pageSize;
  const where = [];
  const params = [];
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (q) {
    where.push('po_number LIKE ?');
    params.push(`%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const data = await query(
    `SELECT * FROM purchase_orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), Number(offset)],
  );
  const [{ total }] = await query(`SELECT COUNT(*) as total FROM purchase_orders ${whereSql}`, params);
  return { data, page: Number(page), pageSize: Number(pageSize), total };
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

const getPO = async (poId) => {
  const [po] = await query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
  return po || null;
};

const getPOByNumber = async (poNumber) => {
  const [po] = await query('SELECT * FROM purchase_orders WHERE po_number = ?', [poNumber]);
  return po || null;
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
  
  // Try to get existing PO
  let existingPO = null;
  if (poId) {
    existingPO = await getPO(poId);
  } else if (formData.poNumber) {
    existingPO = await getPOByNumber(formData.poNumber);
  }
  
  // If no existing PO, try to get latest draft
  if (!existingPO) {
    existingPO = await getLatestDraftPO(userId);
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
  
  const draftDataJson = JSON.stringify({
    formData: cleanFormData,
    boqItems: boqItems,
    savedAt: new Date().toISOString(),
  });
  
  if (existingPO) {
    // Update existing PO
    // Check if draft_data column exists, if not, we'll need to add it via migration
    // For now, try to update with draft_data
    try {
      await query(
        `UPDATE purchase_orders 
         SET draft_data = ?, updated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [draftDataJson, userId, existingPO.id]
      );
    } catch (err) {
      // If draft_data column doesn't exist, create a migration entry
      // For now, update basic fields
      await query(
        `UPDATE purchase_orders 
         SET customer_id = ?, po_number = ?, currency = ?, updated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [formData.customerId || existingPO.customer_id, formData.poNumber || existingPO.po_number, formData.poCurrency || existingPO.currency || 'INR', userId, existingPO.id]
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
    
    return getPO(existingPO.id);
  } else {
    // Create new PO
    const newPoId = poId || uuidv4();
    const poNumber = formData.poNumber || `PO-${Date.now()}`;
    
    await query(
      `INSERT INTO purchase_orders (id, po_number, customer_id, status, currency, issue_date, due_date, total_amount, created_by, updated_by)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, 0, ?, ?)`,
      [
        newPoId,
        poNumber,
        formData.customerId || null,
        formData.poCurrency || 'INR',
        formData.poDate || null,
        formData.lastDateOfDelivery || null,
        userId,
        userId,
      ]
    );
    
    // Try to add draft_data
    try {
      await query(
        `UPDATE purchase_orders SET draft_data = ? WHERE id = ?`,
        [draftDataJson, newPoId]
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
    
    return getPO(newPoId);
  }
};

/**
 * Get PO draft data (form data + BOQ items)
 */
const getPODraft = async (poId = null, userId = null) => {
  let po = null;
  
  if (poId) {
    po = await getPO(poId);
  } else if (userId) {
    po = await getLatestDraftPO(userId);
  }
  
  if (!po) return null;
  
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

module.exports = { 
  listPOs, 
  createPO, 
  updateStatus, 
  getPO, 
  getPOByNumber, 
  getLatestDraftPO,
  upsertPODraft,
  getPODraft,
};

