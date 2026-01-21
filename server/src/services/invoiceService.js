const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const listInvoices = async ({ page = 1, pageSize = 20, status, q }) => {
  const offset = (page - 1) * pageSize;
  const where = [];
  const params = [];
  if (status) {
    where.push('i.status = ?');
    params.push(status);
  }
  if (q) {
    where.push('i.invoice_number LIKE ?');
    params.push(`%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const data = await query(
    `SELECT i.*, c.name AS customer_name, p.po_number
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN purchase_orders p ON p.id = i.po_id
     ${whereSql}
     ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), Number(offset)],
  );
  const [{ total }] = await query(`SELECT COUNT(*) as total FROM invoices i ${whereSql}`, params);
  return { data, page: Number(page), pageSize: Number(pageSize), total };
};

const getInvoice = async (id) => {
  const rows = await query(
    `SELECT i.*, c.name AS customer_name, p.po_number
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN purchase_orders p ON p.id = i.po_id
     WHERE i.id = ?`,
    [id],
  );
  return rows[0] || null;
};

const listInvoiceLines = async (invoiceId) => {
  return query('SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY line_number', [invoiceId]);
};

const createInvoice = async (payload, userId) =>
  transaction(async (conn) => {
    const [[po]] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [payload.poId]);
    if (!po) throw new Error('PO_NOT_FOUND');
    if (po.status !== 'approved' && po.status !== 'closed') throw new Error('PO_NOT_APPROVED');

    const invoiceId = uuidv4();
    let total = 0;
    for (const line of payload.lines) {
      total += line.quantity * line.unitPrice;
    }

    await conn.execute(
      `INSERT INTO invoices (id, invoice_number, po_id, customer_id, status, issue_date, due_date, total_amount, amount_paid, balance, currency, created_by)
       VALUES (?, ?, ?, ?, 'open', ?, ?, ?, 0, ?, ?, ?)`,
      [
        invoiceId,
        payload.invoiceNumber,
        payload.poId,
        payload.customerId,
        payload.issueDate,
        payload.dueDate,
        total,
        total,
        payload.currency || 'USD',
        userId,
      ],
    );

    for (const line of payload.lines) {
      const lineId = uuidv4();
      await conn.execute(
        `INSERT INTO invoice_lines (id, invoice_id, line_number, description, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [lineId, invoiceId, line.lineNumber, line.description, line.productId || null, line.quantity, line.unitPrice],
      );
    }
    const [invoiceRows] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    return invoiceRows[0];
  });

module.exports = { listInvoices, getInvoice, listInvoiceLines, createInvoice };

