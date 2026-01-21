const { query } = require('../db/query');

const getDashboard = async () => {
  const [invoiceAgg, paymentAgg, overdue] = await Promise.all([
    query(
      `SELECT 
         COUNT(*) as invoiceCount,
         SUM(total_amount) as invoiceTotal,
         SUM(balance) as outstanding
       FROM invoices`,
    ),
    query(`SELECT SUM(amount) as totalPaid FROM payments WHERE status <> 'failed'`),
    query(
      `SELECT COUNT(*) as overdueCount
       FROM invoices
       WHERE due_date < CURDATE() AND balance > 0 AND status NOT IN ('cancelled','paid')`,
    ),
  ]);

  const invoicesByStatus = await query('SELECT status, COUNT(*) as count FROM invoices GROUP BY status');
  const paymentsRecent = await query(
    `SELECT p.*, i.invoice_number 
     FROM payments p JOIN invoices i ON i.id = p.invoice_id 
     ORDER BY p.paid_at DESC LIMIT 10`,
  );

  return {
    totals: invoiceAgg[0],
    payments: paymentAgg[0],
    overdue: overdue[0],
    invoicesByStatus,
    paymentsRecent,
  };
};

module.exports = { getDashboard };

