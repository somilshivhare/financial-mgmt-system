const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const getFinancialYearConcat = (dateLike = null) => {
  const d = dateLike ? new Date(dateLike) : new Date();
  const dt = Number.isNaN(d.getTime()) ? new Date() : d;
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}${endYear}`;
};

const generateNextPaymentNumber = async (paymentDateLike = null) => {
  const fy = getFinancialYearConcat(paymentDateLike);

  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT counter FROM payment_number_counter WHERE financial_year = ? FOR UPDATE',
      [fy],
    );

    let counter = 0;
    if (!rows || rows.length === 0) {
      await conn.execute(
        'INSERT INTO payment_number_counter (financial_year, counter) VALUES (?, 0)',
        [fy],
      );
    } else {
      counter = Number(rows[0].counter) || 0;
    }

    counter += 1;
    await conn.execute(
      'UPDATE payment_number_counter SET counter = ?, updated_at = NOW() WHERE financial_year = ?',
      [counter, fy],
    );

    return `PAY-${fy}-${String(counter).padStart(4, '0')}`;
  });
};

const listPayments = async ({ page = 1, pageSize = 20, invoiceId, userId }) => {
  try {
    const offset = (page - 1) * pageSize;
    const where = [];
    const params = [];
    if (userId) {
      where.push('i.created_by = ?');
      params.push(userId);
    }
    if (invoiceId) {
      where.push('p.invoice_id = ?');
      params.push(invoiceId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const data = await query(
      `SELECT
        p.id,
        p.payment_number,
        p.invoice_id,
        p.amount,
        p.method,
        p.reference,
        p.paid_at,
        p.status,
        p.created_at,
        i.invoice_number AS invoice_number_display,
        c.name AS customer_name
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN customers c ON i.customer_id = c.id
       ${whereSql}
       ORDER BY p.paid_at DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)],
    );
    const countResult = await query(
      `SELECT COUNT(*) as total FROM payments p JOIN invoices i ON p.invoice_id = i.id ${whereSql}`,
      params,
    );
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

    let paymentNumber = payload.paymentNumber || payload.paymentID;
    if (!paymentNumber || paymentNumber.includes('XXXX')) {
      paymentNumber = await generateNextPaymentNumber(payload.paidAt || payload.paymentReceiptDate || null);
    }

    const paymentId = uuidv4();
    await conn.execute(
      `INSERT INTO payments (id, payment_number, invoice_id, amount, method, reference, paid_at, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        paymentNumber,
        payload.invoiceId,
        payload.amount,
        payload.method,
        payload.reference || null,
        payload.paidAt,
        payload.status || 'pending',
        userId,
      ],
    );

    const newPaid = Math.round((Number(invoice.amount_paid) + Number(payload.amount)) * 100) / 100;
    const newBalance = Math.round((Number(invoice.total_amount) - newPaid) * 100) / 100;
    const newStatus = newBalance <= 0 ? 'paid' : invoice.status === 'cancelled' ? 'cancelled' : 'open';
    await conn.execute('UPDATE invoices SET amount_paid = ?, balance = ?, status = ? WHERE id = ?', [
      Math.max(0, newPaid),
      Math.max(0, newBalance),
      newStatus,
      payload.invoiceId,
    ]);

    const [paymentRows] = await conn.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);
    const payment = paymentRows[0];
    
    const [[updatedInvoice]] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [payload.invoiceId]);
    
    setImmediate(async () => {
      try {
        const notificationService = require('./notificationService');
        const websocketService = require('./websocketService');
        
        const notifications = await notificationService.notifyPaymentReceived(payment, updatedInvoice);
        
        notifications.forEach(notif => {
          if (notif.user_id) {
            websocketService.sendNotificationToUser(notif.user_id, notif);
          }
        });
      } catch (err) {
        console.error('Error sending payment notification:', err);
      }
    });
    
    return payment;
  });

const getNextPaymentNumber = async (paymentDateLike = null) => {
  try {
    const fy = getFinancialYearConcat(paymentDateLike);
    
    const rows = await query(
      'SELECT counter FROM payment_number_counter WHERE financial_year = ?',
      [fy],
    );

    let counter = 0;
    if (rows && rows.length > 0) {
      counter = Number(rows[0].counter) || 0;
    }

    const nextCounter = counter + 1;
    return `PAY-${fy}-${String(nextCounter).padStart(4, '0')}`;
  } catch (err) {
    console.error('[Payment Service] Error getting next payment number:', err.message);
    const fy = getFinancialYearConcat(paymentDateLike);
    return `PAY-${fy}-0001`;
  }
};

module.exports = { 
  listPayments, 
  createPayment, 
  generateNextPaymentNumber,
  getNextPaymentNumber 
};

