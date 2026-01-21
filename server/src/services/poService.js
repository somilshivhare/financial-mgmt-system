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
    return poRows[0];
  });

const updateStatus = async (poId, status, userId) => {
  await query('UPDATE purchase_orders SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?', [
    status,
    userId,
    poId,
  ]);
  const [po] = await query('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
  return po;
};

module.exports = { listPOs, createPO, updateStatus };

