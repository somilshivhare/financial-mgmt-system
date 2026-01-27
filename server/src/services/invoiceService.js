const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const listInvoices = async ({ page = 1, pageSize = 20, status, q, keyId }) => {
  try {
    const offset = (page - 1) * pageSize;
    const where = [];
    const params = [];
    if (status) {
      where.push('i.status = ?');
      params.push(status);
    }
    if (q) {
      where.push('(i.invoice_number LIKE ? OR i.gst_tax_invoice_no LIKE ? OR i.internal_invoice_no LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (keyId) {
      where.push('i.key_id = ?');
      params.push(keyId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const data = await query(
      `SELECT i.*, c.name AS customer_name, p.po_number
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       LEFT JOIN purchase_orders p ON p.id = i.po_id
       ${whereSql}
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)],
    );
    const countResult = await query(`SELECT COUNT(*) as total FROM invoices i ${whereSql}`, params);
    const total = countResult && countResult[0] ? countResult[0].total : 0;
    return { data: data || [], page: Number(page), pageSize: Number(pageSize), total };
  } catch (err) {
    console.error('[Invoice Service] Error listing invoices:', err.message);
    return { data: [], page: Number(page), pageSize: Number(pageSize), total: 0 };
  }
};

const getInvoice = async (id) => {
  const rows = await query(
    `SELECT i.*, c.name AS customer_name, p.po_number
     FROM invoices i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN purchase_orders p ON p.id = i.po_id
     WHERE i.id = ?`,
    [id],
  );
  return rows[0] || null;
};

// Get invoices by PO Number (Key ID)
const getInvoicesByPONumber = async (poNumber) => {
  const rows = await query(
    `SELECT i.*, c.name AS customer_name, p.po_number
     FROM invoices i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN purchase_orders p ON p.id = i.po_id
     WHERE i.key_id = ? OR p.po_number = ?
     ORDER BY i.created_at DESC`,
    [poNumber, poNumber],
  );
  return rows || [];
};

const listInvoiceLines = async (invoiceId) => {
  return query('SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY line_number', [invoiceId]);
};

const createInvoice = async (payload, userId) =>
  transaction(async (conn) => {
    // Find PO by key_id (PO Number) if poId not provided
    let po = null;
    if (payload.poId) {
      const [[poResult]] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [payload.poId]);
      po = poResult;
    } else if (payload.key_id || payload.keyID) {
      const poNumber = payload.key_id || payload.keyID;
      const [poResults] = await conn.execute('SELECT * FROM purchase_orders WHERE po_number = ?', [poNumber]);
      if (poResults && poResults.length > 0) {
        po = poResults[0];
        payload.poId = po.id;
        payload.customerId = po.customer_id || payload.customerId;
      }
    }
    
    if (!po && payload.poId) {
      const [[poResult]] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [payload.poId]);
      po = poResult;
    }
    
    if (!po) throw new Error('PO_NOT_FOUND');
    if (po.status !== 'approved' && po.status !== 'closed') throw new Error('PO_NOT_APPROVED');

    const invoiceId = uuidv4();
    const invoiceNumber = payload.invoice_number || payload.internalInvoiceNo || `INV-${Date.now()}`;
    const issueDate = payload.issue_date || payload.gstTaxInvoiceDate || new Date().toISOString().split('T')[0];
    const totalAmount = parseFloat(payload.total_amount || payload.totalInvoiceValue || 0);
    
    // Build comprehensive INSERT statement with all fields
    const fields = [
      'id', 'invoice_number', 'po_id', 'customer_id', 'status', 'issue_date', 'due_date',
      'currency', 'basic_rate', 'quantity', 'basic_value', 'freight_rate', 'freight_value',
      'sgst_rate', 'cgst_rate', 'igst_rate', 'ugst_rate',
      'sgst_value', 'cgst_value', 'igst_value', 'ugst_value', 'total_gst',
      'subtotal', 'total_amount', 'amount_paid', 'balance',
      'first_due_date', 'first_due_amount', 'first_received_amount', 'first_receipt_date',
      'second_due_date', 'second_due_amount', 'second_received_amount', 'second_receipt_date',
      'third_due_date', 'third_due_amount', 'third_received_amount', 'third_receipt_date',
      'key_id', 'gst_tax_invoice_no', 'gst_tax_invoice_date', 'internal_invoice_no',
      'sales_order_no', 'material_description_type', 'unit', 'freight_invoice_no', 'tcs',
      'consignee_name_address', 'consignee_city', 'payer_name_address', 'payer_city',
      'lorry_receipt_no', 'lorry_receipt_date', 'transporter_name',
      'delivery_challan_no', 'delivery_challan_date',
      'material_inspection_request_date', 'inspection_offer_date', 'material_inspection_date',
      'delivery_instruction_date', 'delivery_inspection_cip_received_date', 'micc_receipt_date',
      'last_date_of_dispatch', 'invoice_ready_date',
      'courier_document_no', 'courier_document_date', 'courier_company_name',
      'bill_sent_to_person_name', 'bill_sent_date',
      'last_date_of_material_receipt', 'invoice_receipt_date', 'invoice_receipt_person_name',
      'material_verification_date',
      'jvr_date', 'srn_date', 'mrc_date',
      'invoice_submission_at_site_date', 'invoice_forwarded_to_ho_date', 'invoice_forwarded_for_payment_date',
      'payment_text',
      'it_tds_2_percent', 'it_tds_1_percent_194q', 'lcess_boq_1_percent',
      'tds_2_percent_cgst_sgst', 'tds_on_cgst_1_percent', 'tds_on_sgst_1_percent',
      'excess_supply_qty', 'interest_on_advance', 'any_hold', 'penalty_ld_deduction',
      'bank_charges', 'lc_discrepancy_charge', 'provision_for_bad_debts', 'bad_debts',
      'created_by'
    ];
    
    const placeholders = fields.map(() => '?').join(', ');
    const values = [
      invoiceId,
      invoiceNumber,
      payload.poId || po.id,
      payload.customerId || po.customer_id,
      payload.status || 'open',
      issueDate,
      payload.due_date || payload.firstDueDate || issueDate,
      payload.currency || 'INR',
      parseFloat(payload.basic_rate || payload.basicRate || 0),
      parseFloat(payload.quantity || payload.qty || 0),
      parseFloat(payload.basic_value || payload.basicValue || 0),
      parseFloat(payload.freight_rate || payload.freightRate || 0),
      parseFloat(payload.freight_value || payload.freightValue || 0),
      parseFloat(payload.sgst_rate || payload.sgstRate || 0),
      parseFloat(payload.cgst_rate || payload.cgstRate || 0),
      parseFloat(payload.igst_rate || payload.igstRate || 0),
      parseFloat(payload.ugst_rate || payload.ugstRate || 0),
      parseFloat(payload.sgst_value || payload.sgstOutput || payload.sgstValue || 0),
      parseFloat(payload.cgst_value || payload.cgstOutput || payload.cgstValue || 0),
      parseFloat(payload.igst_value || payload.igstOutput || payload.igstValue || 0),
      parseFloat(payload.ugst_value || payload.ugstOutput || payload.ugstValue || 0),
      parseFloat(payload.total_gst || payload.totalGST || 0),
      parseFloat(payload.subtotal || 0),
      totalAmount,
      parseFloat(payload.amount_paid || 0),
      parseFloat(payload.balance || payload.totalBalance || totalAmount),
      payload.first_due_date || payload.firstDueDate || null,
      parseFloat(payload.first_due_amount || payload.firstDueAmount || 0),
      parseFloat(payload.first_received_amount || payload.paymentReceivedAmount1stDue || 0),
      payload.first_receipt_date || payload.receiptDate1stDue || null,
      payload.second_due_date || payload.secondDueDate || null,
      parseFloat(payload.second_due_amount || payload.secondDueAmount || 0),
      parseFloat(payload.second_received_amount || payload.paymentReceivedAmount2ndDue || 0),
      payload.second_receipt_date || payload.receiptDate2ndDue || null,
      payload.third_due_date || payload.thirdDueDate || null,
      parseFloat(payload.third_due_amount || payload.thirdDueAmount || 0),
      parseFloat(payload.third_received_amount || payload.paymentReceivedAmount3rdDue || 0),
      payload.third_receipt_date || payload.receiptDate3rdDue || null,
      payload.key_id || payload.keyID || null,
      payload.gst_tax_invoice_no || payload.gstTaxInvoiceNo || null,
      payload.gst_tax_invoice_date || payload.gstTaxInvoiceDate || null,
      payload.internal_invoice_no || payload.internalInvoiceNo || invoiceNumber,
      payload.sales_order_no || payload.salesOrderNo || null,
      payload.material_description_type || payload.materialDescriptionType || null,
      payload.unit || null,
      payload.freight_invoice_no || payload.freightInvoiceNo || null,
      parseFloat(payload.tcs || 0),
      payload.consignee_name_address || payload.consigneeNameAddress || null,
      payload.consignee_city || payload.consigneeCity || null,
      payload.payer_name_address || payload.payerNameAddress || null,
      payload.payer_city || payload.payerCity || null,
      payload.lorry_receipt_no || payload.lorryReceiptNo || null,
      payload.lorry_receipt_date || payload.lorryReceiptDate || null,
      payload.transporter_name || payload.transporterName || null,
      payload.delivery_challan_no || payload.deliveryChallanNo || null,
      payload.delivery_challan_date || payload.deliveryChallanDate || null,
      payload.material_inspection_request_date || payload.materialInspectionRequestDate || null,
      payload.inspection_offer_date || payload.inspectionOfferDate || null,
      payload.material_inspection_date || payload.materialInspectionDate || null,
      payload.delivery_instruction_date || payload.deliveryInstructionDate || null,
      payload.delivery_inspection_cip_received_date || payload.deliveryInspectionCIPReceivedDate || null,
      payload.micc_receipt_date || payload.miccReceiptDate || null,
      payload.last_date_of_dispatch || payload.lastDateOfDispatch || null,
      payload.invoice_ready_date || payload.invoiceReadyDate || null,
      payload.courier_document_no || payload.courierDocumentNo || null,
      payload.courier_document_date || payload.courierDocumentDate || null,
      payload.courier_company_name || payload.courierCompanyName || null,
      payload.bill_sent_to_person_name || payload.billSentToPersonName || null,
      payload.bill_sent_date || payload.billSentDate || null,
      payload.last_date_of_material_receipt || payload.lastDateOfMaterialReceipt || null,
      payload.invoice_receipt_date || payload.invoiceReceiptDate || null,
      payload.invoice_receipt_person_name || payload.invoiceReceiptPersonName || null,
      payload.material_verification_date || payload.materialVerificationDate || null,
      payload.jvr_date || payload.jvrDate || null,
      payload.srn_date || payload.srnDate || null,
      payload.mrc_date || payload.mrcDate || null,
      payload.invoice_submission_at_site_date || payload.invoiceSubmissionAtSiteDate || null,
      payload.invoice_forwarded_to_ho_date || payload.invoiceForwardedToHODate || null,
      payload.invoice_forwarded_for_payment_date || payload.invoiceForwardedForPaymentDate || null,
      payload.payment_text || payload.paymentText || null,
      parseFloat(payload.it_tds_2_percent || payload.itTDS2Percent || 0),
      parseFloat(payload.it_tds_1_percent_194q || payload.itTDS1Percent194Q || 0),
      parseFloat(payload.lcess_boq_1_percent || payload.lcessBoq1Percent || 0),
      parseFloat(payload.tds_2_percent_cgst_sgst || payload.tds2PercentCGSTSGST || 0),
      parseFloat(payload.tds_on_cgst_1_percent || payload.tdsOnCGST1Percent || 0),
      parseFloat(payload.tds_on_sgst_1_percent || payload.tdsOnSGST1Percent || 0),
      parseFloat(payload.excess_supply_qty || payload.excessSupplyQty || 0),
      parseFloat(payload.interest_on_advance || payload.interestOnAdvance || 0),
      parseFloat(payload.any_hold || payload.anyHold || 0),
      parseFloat(payload.penalty_ld_deduction || payload.penaltyLDDeduction || 0),
      parseFloat(payload.bank_charges || 0),
      parseFloat(payload.lc_discrepancy_charge || payload.lcDiscrepancyCharge || 0),
      parseFloat(payload.provision_for_bad_debts || payload.provisionForBadDebts || 0),
      parseFloat(payload.bad_debts || payload.badDebts || 0),
      userId,
    ];

    await conn.execute(
      `INSERT INTO invoices (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );

    // Handle invoice lines if provided
    if (payload.lines && Array.isArray(payload.lines)) {
      for (const line of payload.lines) {
        const lineId = uuidv4();
        await conn.execute(
          `INSERT INTO invoice_lines (id, invoice_id, line_number, description, product_id, quantity, unit_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [lineId, invoiceId, line.lineNumber, line.description, line.productId || null, line.quantity, line.unitPrice],
        );
      }
    }
    
    const [invoiceRows] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    const invoice = invoiceRows[0];
    
    // Trigger notification after transaction commits
    setImmediate(async () => {
      try {
        const notificationService = require('./notificationService');
        const websocketService = require('./websocketService');
        const notifications = await notificationService.notifyInvoiceCreated(invoice, userId);
        
        // Send via WebSocket
        notifications.forEach(notif => {
          if (notif.user_id) {
            websocketService.sendNotificationToUser(notif.user_id, notif);
          }
        });
      } catch (err) {
        console.error('Error sending invoice creation notification:', err);
      }
    });
    
    return invoice;
  });

module.exports = { listInvoices, getInvoice, listInvoiceLines, createInvoice, getInvoicesByPONumber };

