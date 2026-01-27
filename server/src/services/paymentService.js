const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const listPayments = async ({ page = 1, pageSize = 20, invoiceId }) => {
  try {
    const offset = (page - 1) * pageSize;
    const where = [];
    const params = [];
    if (invoiceId) {
      where.push('invoice_id = ?');
      params.push(invoiceId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const data = await query(
      `SELECT * FROM payments ${whereSql} ORDER BY paid_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)],
    );
    const countResult = await query(`SELECT COUNT(*) as total FROM payments ${whereSql}`, params);
    const total = countResult && countResult[0] ? countResult[0].total : 0;
    return { data: data || [], page: Number(page), pageSize: Number(pageSize), total };
  } catch (err) {
    console.error('[Payment Service] Error listing payments:', err.message);
    return { data: [], page: Number(page), pageSize: Number(pageSize), total: 0 };
  }
};

const createPayment = async (payload, userId) =>
  transaction(async (conn) => {
    const [[invoice]] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [payload.invoiceId]);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');

    const paymentId = uuidv4();
    await conn.execute(
      `INSERT INTO payments (id, invoice_id, amount, method, reference, paid_at, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        payload.invoiceId,
        payload.amount,
        payload.method,
        payload.reference || null,
        payload.paidAt,
        payload.status || 'pending',
        userId,
      ],
    );

    const newPaid = Number(invoice.amount_paid) + Number(payload.amount);
    const newBalance = Number(invoice.total_amount) - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : invoice.status === 'cancelled' ? 'cancelled' : 'open';
    await conn.execute('UPDATE invoices SET amount_paid = ?, balance = ?, status = ? WHERE id = ?', [
      newPaid,
      newBalance,
      newStatus,
      payload.invoiceId,
    ]);

    const [paymentRows] = await conn.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);
    const payment = paymentRows[0];
    
    // Get updated invoice
    const [[updatedInvoice]] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [payload.invoiceId]);
    
    // Trigger notification and alert after transaction commits
    setImmediate(async () => {
      try {
        const notificationService = require('./notificationService');
        const alertsService = require('./alertsService');
        const websocketService = require('./websocketService');
        
        // Create notifications
        const notifications = await notificationService.notifyPaymentReceived(payment, updatedInvoice);
        
        // Create alert for payment received
        await alertsService.createPaymentReceivedAlert(payment, updatedInvoice, userId);
        
        // Send via WebSocket
        notifications.forEach(notif => {
          if (notif.user_id) {
            websocketService.sendNotificationToUser(notif.user_id, notif);
          }
        });
      } catch (err) {
        console.error('Error sending payment notification/alert:', err);
      }
    });
    
    return payment;
  });

module.exports = { listPayments, createPayment };

