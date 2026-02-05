const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

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

/**
 * Generate next payment number (transaction-safe)
 * Format: PAY-{FY}-{NNNN}
 */
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

    // Generate payment number if not provided or contains XXXX
    // Accept both paymentNumber and paymentID (from frontend) for compatibility
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
    
    // Trigger notification after transaction commits
    setImmediate(async () => {
      try {
        const notificationService = require('./notificationService');
        const websocketService = require('./websocketService');
        
        // Create notifications
        const notifications = await notificationService.notifyPaymentReceived(payment, updatedInvoice);
        
        // Send via WebSocket
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

/**
 * Get next payment number without creating a payment
 * Useful for frontend to display the next payment number before submission
 */
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

    // Return next number (counter + 1) without incrementing
    const nextCounter = counter + 1;
    return `PAY-${fy}-${String(nextCounter).padStart(4, '0')}`;
  } catch (err) {
    console.error('[Payment Service] Error getting next payment number:', err.message);
    // Fallback to current financial year with 0001
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

