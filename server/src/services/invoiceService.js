const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

/**
 * List invoices with pagination. Does NOT join invoice_lines so that invoices
 * without line items are always included. Line items are fetched only on the
 * invoice detail view via listInvoiceLines().
 */
const listInvoices = async ({ page = 1, pageSize = 20, status, q, keyId }) => {
  try {
    // Ensure page and pageSize are valid integers
    const pageInt = parseInt(page, 10);
    const pageSizeInt = parseInt(pageSize, 10);
    const validPage = !isNaN(pageInt) && pageInt > 0 ? pageInt : 1;
    const validPageSize = !isNaN(pageSizeInt) && pageSizeInt > 0 ? pageSizeInt : 20;
    const offset = (validPage - 1) * validPageSize;
    
    // Build WHERE clause and params array conditionally
    const where = [];
    const params = [];
    
    if (status && typeof status === 'string' && status.trim()) {
      where.push('i.status = ?');
      params.push(status.trim());
    }
    if (q && typeof q === 'string' && q.trim()) {
      where.push('(i.invoice_number LIKE ? OR i.gst_tax_invoice_no LIKE ? OR i.internal_invoice_no LIKE ?)');
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (keyId && typeof keyId === 'string' && keyId.trim()) {
      where.push('i.key_id = ?');
      params.push(keyId.trim());
    }
    
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    // Build final query params: filter params + LIMIT + OFFSET (order matters!)
    // IMPORTANT: LIMIT and OFFSET must be passed as numbers
    const limit = parseInt(validPageSize, 10);
    const offsetVal = parseInt(offset, 10);
    const queryParams = [...params, limit, offsetVal];
    
    // Execute main query
    const data = await query(
      `SELECT i.*, c.name AS customer_name, p.po_number
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       LEFT JOIN purchase_orders p ON p.id = i.po_id
       ${whereSql}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );
    
    // Execute count query (uses same WHERE params, no LIMIT/OFFSET)
    const countResult = await query(
      `SELECT COUNT(*) as total FROM invoices i ${whereSql}`,
      params
    );
    const total = countResult && countResult[0] ? countResult[0].total : 0;
    
    return { 
      data: data || [], 
      page: validPage, 
      pageSize: validPageSize, 
      total 
    };
  } catch (err) {
    console.error('[Invoice Service] Error listing invoices:', err.message);
    console.error('[Invoice Service] Error stack:', err.stack);
    return { data: [], page: 1, pageSize: 20, total: 0 };
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

/** Financial year (April–March) as concatenated string, e.g. 20252026 */
function getFinancialYearConcat(dateLike = null) {
  const d = dateLike ? new Date(dateLike) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return `${fyStart}${fyEnd}`;
}

/**
 * Get next internal invoice number. Format: INV-{type}-{bu}-{fy}-{NNNN}
 * Example: INV-REG-MAIN-20252026-0001
 */
const getNextInvoiceNumber = async (invoiceType = 'REG', businessUnit = 'MAIN') => {
  const type = (invoiceType || 'REG').toString().trim().toUpperCase().slice(0, 8) || 'REG';
  const bu = (businessUnit || 'MAIN').toString().trim().toUpperCase().slice(0, 16) || 'MAIN';
  const fy = getFinancialYearConcat();
  const prefix = `INV-${type}-${bu}-${fy}-`;
  const likePattern = `${prefix}%`;
  const rows = await query(
    'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY LENGTH(invoice_number) DESC, invoice_number DESC LIMIT 1',
    [likePattern],
  );
  let nextSeq = 1;
  if (rows && rows.length > 0 && rows[0].invoice_number) {
    const lastPart = rows[0].invoice_number.slice(prefix.length);
    const num = parseInt(lastPart, 10);
    if (!Number.isNaN(num) && num >= 0) nextSeq = num + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

const VALID_PO_STATUSES = ['approved', 'closed'];

const createInvoice = async (payload, userId) =>
  transaction(async (conn) => {
    // Resolve PO from a single source: poId (preferred) or key_id/keyID. Only accept submitted/approved POs.
    let po = null;
    if (payload.poId && typeof payload.poId === 'string' && payload.poId.trim()) {
      const [[poResult]] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [payload.poId.trim()]);
      if (poResult) {
        if (!VALID_PO_STATUSES.includes(poResult.status)) {
          throw new Error('PO_NOT_APPROVED');
        }
        po = poResult;
      }
    }
    if (!po && (payload.key_id || payload.keyID)) {
      const poNumber = String(payload.key_id || payload.keyID).trim();
      if (poNumber) {
        const [poResults] = await conn.execute(
          'SELECT * FROM purchase_orders WHERE po_number = ? AND status IN (?, ?) ORDER BY updated_at DESC LIMIT 1',
          [poNumber, 'approved', 'closed']
        );
        if (poResults && poResults.length > 0) {
          po = poResults[0];
          payload.poId = po.id;
        }
      }
    }
    if (!po) throw new Error('PO_NOT_FOUND');

    // Single source of truth for customer: use only the validated PO's customer_id (never payload from frontend).
    const customerId = po.customer_id;
    if (!customerId || typeof customerId !== 'string' || !customerId.trim()) {
      const err = new Error('The selected PO has no customer linked. Please link a customer to the PO first.');
      err.code = 'ERR_CUSTOMER_REQUIRED';
      throw err;
    }
    let resolvedCustomerId = customerId.trim();
    const [[customerRow]] = await conn.execute('SELECT id FROM customers WHERE id = ? LIMIT 1', [resolvedCustomerId]);
    if (!customerRow) {
      // PO may store master_data id (e.g. after migration 017). Resolve to customers.id by name from master_data.
      const [mdRows] = await conn.execute(
        "SELECT id, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.customerName')), JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.companyName'))) AS name FROM master_data WHERE id = ? AND type IN ('company-profile', 'customer-profile') LIMIT 1",
        [resolvedCustomerId]
      );
      if (mdRows && mdRows.length > 0 && mdRows[0].name) {
        const custName = String(mdRows[0].name).trim();
        const [custByName] = await conn.execute('SELECT id FROM customers WHERE name = ? AND status = ? LIMIT 1', [custName, 'active']);
        if (custByName && custByName.length > 0) {
          resolvedCustomerId = custByName[0].id;
        } else {
          // No customers row for this name (Master Data customer never synced). Create one so invoice can reference it.
          const newCustomerId = uuidv4();
          await conn.execute(
            'INSERT INTO customers (id, name, status) VALUES (?, ?, ?)',
            [newCustomerId, custName, 'active']
          );
          resolvedCustomerId = newCustomerId;
        }
      }
      if (resolvedCustomerId === customerId.trim()) {
        const err = new Error('The PO is linked to a customer that does not exist in the system. Please update the PO with a valid customer.');
        err.code = 'ERR_CUSTOMER_NOT_FOUND';
        throw err;
      }
    }

    const invoiceId = uuidv4();
    const invoiceNumber = payload.invoice_number || payload.internalInvoiceNo || `INV-${Date.now()}`;
    const issueDate = payload.issue_date || payload.gstTaxInvoiceDate || new Date().toISOString().split('T')[0];
    const totalAmount = parseFloat(payload.total_amount || payload.totalInvoiceValue || 0);
    
    // Build comprehensive INSERT statement with all fields (every form field persisted)
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
      'invoice_type', 'business_unit', 'customer_name', 'segment', 'region', 'zone',
      'sales_order_no', 'account_manager_name', 'account_manager_id', 'po_no_reference', 'po_date',
      'material_description_type', 'state_of_supply', 'unit', 'freight_invoice_no', 'tcs',
      'consignee_id', 'consignee_name_address', 'consignee_city',
      'payer_id', 'payer_name_address', 'payer_city',
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
      'payment_terms_id', 'payment_terms', 'payment_text',
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
      resolvedCustomerId,
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
      payload.invoice_type || payload.invoiceType || null,
      payload.business_unit || payload.businessUnit || null,
      payload.customer_name || payload.customerName || null,
      payload.segment || null,
      payload.region || null,
      payload.zone || null,
      payload.sales_order_no || payload.salesOrderNo || null,
      payload.account_manager_name || payload.accountManagerName || null,
      payload.account_manager_id || payload.accountManagerId || null,
      payload.po_no_reference || payload.poNoReference || null,
      payload.po_date || payload.poDate || null,
      payload.material_description_type || payload.materialDescriptionType || null,
      payload.state_of_supply || payload.stateOfSupply || null,
      payload.unit || null,
      payload.freight_invoice_no || payload.freightInvoiceNo || null,
      parseFloat(payload.tcs || 0),
      payload.consignee_id || payload.consigneeId || null,
      payload.consignee_name_address || payload.consigneeNameAddress || null,
      payload.consignee_city || payload.consigneeCity || null,
      payload.payer_id || payload.payerId || null,
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
      payload.payment_terms_id || payload.paymentTermsId || null,
      payload.payment_terms || payload.paymentTerms || null,
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

// Helper: map payload to DB value (supports both snake_case and camelCase)
const val = (p, ...keys) => {
  for (const k of keys) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== '') return p[k];
  }
  return null;
};
const num = (p, ...keys) => {
  const v = val(p, ...keys);
  if (v === null || v === undefined) return 0;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

// Resolve approved/closed PO and customer_id from it (single source of truth). Returns { poId, customerId } or null.
const resolvePOAndCustomer = async (conn, payload) => {
  let po = null;
  if (payload.poId && String(payload.poId).trim()) {
    const [[row]] = await conn.execute('SELECT * FROM purchase_orders WHERE id = ?', [payload.poId.trim()]);
    if (row && VALID_PO_STATUSES.includes(row.status)) po = row;
  }
  if (!po && (payload.key_id || payload.keyID)) {
    const poNumber = String(payload.key_id || payload.keyID).trim();
    const [rows] = await conn.execute(
      'SELECT * FROM purchase_orders WHERE po_number = ? AND status IN (?, ?) ORDER BY updated_at DESC LIMIT 1',
      [poNumber, 'approved', 'closed']
    );
    if (rows && rows[0]) po = rows[0];
  }
  if (!po || !po.customer_id) return null;
  let resolvedCustomerId = String(po.customer_id).trim();
  const [[customerRow]] = await conn.execute('SELECT id FROM customers WHERE id = ? LIMIT 1', [resolvedCustomerId]);
  if (!customerRow) {
    const [mdRows] = await conn.execute(
      "SELECT id, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.customerName')), JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.companyName'))) AS name FROM master_data WHERE id = ? AND type IN ('company-profile', 'customer-profile') LIMIT 1",
      [resolvedCustomerId]
    );
    if (mdRows && mdRows.length > 0 && mdRows[0].name) {
      const custName = String(mdRows[0].name).trim();
      const [custByName] = await conn.execute('SELECT id FROM customers WHERE name = ? AND status = ? LIMIT 1', [custName, 'active']);
      if (custByName && custByName.length > 0) resolvedCustomerId = custByName[0].id;
    }
  }
  return { poId: po.id, customerId: resolvedCustomerId };
};

const updateInvoice = async (invoiceId, payload, userId) =>
  transaction(async (conn) => {
    const [[existing]] = await conn.execute('SELECT id, po_id, customer_id FROM invoices WHERE id = ?', [invoiceId]);
    if (!existing) return null;

    let poId = payload.poId || existing.po_id;
    let customerId = payload.customerId || payload.customer_id || existing.customer_id;
    if (payload.poId || payload.key_id || payload.keyID) {
      const resolved = await resolvePOAndCustomer(conn, payload);
      if (resolved) {
        poId = resolved.poId;
        customerId = resolved.customerId;
      }
    }
    const issueDate = payload.issue_date || payload.gstTaxInvoiceDate || null;
    const totalAmount = num(payload, 'total_amount', 'totalInvoiceValue');

    const updates = [
      ['invoice_number', val(payload, 'invoice_number', 'internalInvoiceNo')],
      ['po_id', poId],
      ['customer_id', customerId],
      ['status', payload.status || 'open'],
      ['issue_date', issueDate],
      ['due_date', val(payload, 'due_date', 'firstDueDate')],
      ['currency', val(payload, 'currency') || 'INR'],
      ['basic_rate', num(payload, 'basic_rate', 'basicRate')],
      ['quantity', num(payload, 'quantity', 'qty')],
      ['basic_value', num(payload, 'basic_value', 'basicValue')],
      ['freight_rate', num(payload, 'freight_rate', 'freightRate')],
      ['freight_value', num(payload, 'freight_value', 'freightValue')],
      ['sgst_rate', num(payload, 'sgst_rate', 'sgstRate')],
      ['cgst_rate', num(payload, 'cgst_rate', 'cgstRate')],
      ['igst_rate', num(payload, 'igst_rate', 'igstRate')],
      ['ugst_rate', num(payload, 'ugst_rate', 'ugstRate')],
      ['sgst_value', num(payload, 'sgst_value', 'sgstOutput', 'sgstValue')],
      ['cgst_value', num(payload, 'cgst_value', 'cgstOutput', 'cgstValue')],
      ['igst_value', num(payload, 'igst_value', 'igstOutput', 'igstValue')],
      ['ugst_value', num(payload, 'ugst_value', 'ugstOutput', 'ugstValue')],
      ['total_gst', num(payload, 'total_gst', 'totalGST')],
      ['subtotal', num(payload, 'subtotal')],
      ['total_amount', totalAmount],
      ['amount_paid', num(payload, 'amount_paid')],
      ['balance', num(payload, 'balance', 'totalBalance')],
      ['first_due_date', val(payload, 'first_due_date', 'firstDueDate')],
      ['first_due_amount', num(payload, 'first_due_amount', 'firstDueAmount')],
      ['first_received_amount', num(payload, 'first_received_amount', 'paymentReceivedAmount1stDue')],
      ['first_receipt_date', val(payload, 'first_receipt_date', 'receiptDate1stDue')],
      ['second_due_date', val(payload, 'second_due_date', 'secondDueDate')],
      ['second_due_amount', num(payload, 'second_due_amount', 'secondDueAmount')],
      ['second_received_amount', num(payload, 'second_received_amount', 'paymentReceivedAmount2ndDue')],
      ['second_receipt_date', val(payload, 'second_receipt_date', 'receiptDate2ndDue')],
      ['third_due_date', val(payload, 'third_due_date', 'thirdDueDate')],
      ['third_due_amount', num(payload, 'third_due_amount', 'thirdDueAmount')],
      ['third_received_amount', num(payload, 'third_received_amount', 'paymentReceivedAmount3rdDue')],
      ['third_receipt_date', val(payload, 'third_receipt_date', 'receiptDate3rdDue')],
      ['key_id', val(payload, 'key_id', 'keyID')],
      ['gst_tax_invoice_no', val(payload, 'gst_tax_invoice_no', 'gstTaxInvoiceNo')],
      ['invoice_type', val(payload, 'invoice_type', 'invoiceType')],
      ['business_unit', val(payload, 'business_unit', 'businessUnit')],
      ['customer_name', val(payload, 'customer_name', 'customerName')],
      ['segment', val(payload, 'segment')],
      ['region', val(payload, 'region')],
      ['zone', val(payload, 'zone')],
      ['account_manager_name', val(payload, 'account_manager_name', 'accountManagerName')],
      ['account_manager_id', val(payload, 'account_manager_id', 'accountManagerId')],
      ['po_no_reference', val(payload, 'po_no_reference', 'poNoReference')],
      ['po_date', val(payload, 'po_date', 'poDate')],
      ['state_of_supply', val(payload, 'state_of_supply', 'stateOfSupply')],
      ['payment_terms_id', val(payload, 'payment_terms_id', 'paymentTermsId')],
      ['payment_terms', val(payload, 'payment_terms', 'paymentTerms')],
      ['gst_tax_invoice_date', val(payload, 'gst_tax_invoice_date', 'gstTaxInvoiceDate')],
      ['internal_invoice_no', val(payload, 'internal_invoice_no', 'internalInvoiceNo')],
      ['sales_order_no', val(payload, 'sales_order_no', 'salesOrderNo')],
      ['material_description_type', val(payload, 'material_description_type', 'materialDescriptionType')],
      ['unit', val(payload, 'unit')],
      ['freight_invoice_no', val(payload, 'freight_invoice_no', 'freightInvoiceNo')],
      ['tcs', num(payload, 'tcs')],
      ['consignee_id', val(payload, 'consignee_id', 'consigneeId')],
      ['consignee_name_address', val(payload, 'consignee_name_address', 'consigneeNameAddress')],
      ['consignee_city', val(payload, 'consignee_city', 'consigneeCity')],
      ['payer_id', val(payload, 'payer_id', 'payerId')],
      ['payer_name_address', val(payload, 'payer_name_address', 'payerNameAddress')],
      ['payer_city', val(payload, 'payer_city', 'payerCity')],
      ['lorry_receipt_no', val(payload, 'lorry_receipt_no', 'lorryReceiptNo')],
      ['lorry_receipt_date', val(payload, 'lorry_receipt_date', 'lorryReceiptDate')],
      ['transporter_name', val(payload, 'transporter_name', 'transporterName')],
      ['delivery_challan_no', val(payload, 'delivery_challan_no', 'deliveryChallanNo')],
      ['delivery_challan_date', val(payload, 'delivery_challan_date', 'deliveryChallanDate')],
      ['material_inspection_request_date', val(payload, 'material_inspection_request_date', 'materialInspectionRequestDate')],
      ['inspection_offer_date', val(payload, 'inspection_offer_date', 'inspectionOfferDate')],
      ['material_inspection_date', val(payload, 'material_inspection_date', 'materialInspectionDate')],
      ['delivery_instruction_date', val(payload, 'delivery_instruction_date', 'deliveryInstructionDate')],
      ['delivery_inspection_cip_received_date', val(payload, 'delivery_inspection_cip_received_date', 'deliveryInspectionCIPReceivedDate')],
      ['micc_receipt_date', val(payload, 'micc_receipt_date', 'miccReceiptDate')],
      ['last_date_of_dispatch', val(payload, 'last_date_of_dispatch', 'lastDateOfDispatch')],
      ['invoice_ready_date', val(payload, 'invoice_ready_date', 'invoiceReadyDate')],
      ['courier_document_no', val(payload, 'courier_document_no', 'courierDocumentNo')],
      ['courier_document_date', val(payload, 'courier_document_date', 'courierDocumentDate')],
      ['courier_company_name', val(payload, 'courier_company_name', 'courierCompanyName')],
      ['bill_sent_to_person_name', val(payload, 'bill_sent_to_person_name', 'billSentToPersonName')],
      ['bill_sent_date', val(payload, 'bill_sent_date', 'billSentDate')],
      ['last_date_of_material_receipt', val(payload, 'last_date_of_material_receipt', 'lastDateOfMaterialReceipt')],
      ['invoice_receipt_date', val(payload, 'invoice_receipt_date', 'invoiceReceiptDate')],
      ['invoice_receipt_person_name', val(payload, 'invoice_receipt_person_name', 'invoiceReceiptPersonName')],
      ['material_verification_date', val(payload, 'material_verification_date', 'materialVerificationDate')],
      ['jvr_date', val(payload, 'jvr_date')],
      ['srn_date', val(payload, 'srn_date')],
      ['mrc_date', val(payload, 'mrc_date')],
      ['invoice_submission_at_site_date', val(payload, 'invoice_submission_at_site_date', 'invoiceSubmissionAtSiteDate')],
      ['invoice_forwarded_to_ho_date', val(payload, 'invoice_forwarded_to_ho_date', 'invoiceForwardedToHODate')],
      ['invoice_forwarded_for_payment_date', val(payload, 'invoice_forwarded_for_payment_date', 'invoiceForwardedForPaymentDate')],
      ['payment_text', val(payload, 'payment_text', 'paymentText')],
      ['it_tds_2_percent', num(payload, 'it_tds_2_percent', 'itTDS2Percent')],
      ['it_tds_1_percent_194q', num(payload, 'it_tds_1_percent_194q', 'itTDS1Percent194Q')],
      ['lcess_boq_1_percent', num(payload, 'lcess_boq_1_percent', 'lcessBoq1Percent')],
      ['tds_2_percent_cgst_sgst', num(payload, 'tds_2_percent_cgst_sgst', 'tds2PercentCGSTSGST')],
      ['tds_on_cgst_1_percent', num(payload, 'tds_on_cgst_1_percent', 'tdsOnCGST1Percent')],
      ['tds_on_sgst_1_percent', num(payload, 'tds_on_sgst_1_percent', 'tdsOnSGST1Percent')],
      ['excess_supply_qty', num(payload, 'excess_supply_qty', 'excessSupplyQty')],
      ['interest_on_advance', num(payload, 'interest_on_advance', 'interestOnAdvance')],
      ['any_hold', num(payload, 'any_hold', 'anyHold')],
      ['penalty_ld_deduction', num(payload, 'penalty_ld_deduction', 'penaltyLDDeduction')],
      ['bank_charges', num(payload, 'bank_charges')],
      ['lc_discrepancy_charge', num(payload, 'lc_discrepancy_charge', 'lcDiscrepancyCharge')],
      ['provision_for_bad_debts', num(payload, 'provision_for_bad_debts', 'provisionForBadDebts')],
      ['bad_debts', num(payload, 'bad_debts', 'badDebts')],
      ['updated_by', userId],
    ];

    const setClause = updates.map(([col]) => `\`${col}\` = ?`).join(', ');
    const setValues = updates.map(([, v]) => (v === null || v === undefined ? null : v));
    await conn.execute(`UPDATE invoices SET ${setClause} WHERE id = ?`, [...setValues, invoiceId]);

    const [[invoice]] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    return invoice;
  });

module.exports = { listInvoices, getInvoice, listInvoiceLines, createInvoice, updateInvoice, getInvoicesByPONumber, getNextInvoiceNumber };

