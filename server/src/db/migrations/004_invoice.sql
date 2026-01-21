CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  po_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  status ENUM('draft','open','paid','overdue','cancelled') NOT NULL DEFAULT 'open',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency VARCHAR(8) DEFAULT 'USD',

  -- Value components for reporting
  basic_rate DECIMAL(14,2) DEFAULT 0,
  quantity DECIMAL(14,2) DEFAULT 0,
  basic_value DECIMAL(14,2) DEFAULT 0,
  freight_rate DECIMAL(14,2) DEFAULT 0,
  freight_value DECIMAL(14,2) DEFAULT 0,

  sgst_rate DECIMAL(6,2) DEFAULT 0,
  cgst_rate DECIMAL(6,2) DEFAULT 0,
  igst_rate DECIMAL(6,2) DEFAULT 0,
  ugst_rate DECIMAL(6,2) DEFAULT 0,

  sgst_value DECIMAL(14,2) DEFAULT 0,
  cgst_value DECIMAL(14,2) DEFAULT 0,
  igst_value DECIMAL(14,2) DEFAULT 0,
  ugst_value DECIMAL(14,2) DEFAULT 0,
  total_gst DECIMAL(14,2) DEFAULT 0,

  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,

  -- Payment tracking
  amount_paid DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,

  -- Due stages
  first_due_date DATE NULL,
  first_due_amount DECIMAL(14,2) DEFAULT 0,
  first_received_amount DECIMAL(14,2) DEFAULT 0,
  first_receipt_date DATE NULL,
  second_due_date DATE NULL,
  second_due_amount DECIMAL(14,2) DEFAULT 0,
  second_received_amount DECIMAL(14,2) DEFAULT 0,
  second_receipt_date DATE NULL,
  third_due_date DATE NULL,
  third_due_amount DECIMAL(14,2) DEFAULT 0,
  third_received_amount DECIMAL(14,2) DEFAULT 0,
  third_receipt_date DATE NULL,

  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_inv_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_inv_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
  KEY idx_inv_customer (customer_id),
  KEY idx_inv_status (status),
  KEY idx_inv_due_date (due_date),
  KEY idx_inv_balance (balance)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  line_number INT NOT NULL,
  description TEXT,
  product_id CHAR(36),
  quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_il_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_il_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uq_il_invoice_line (invoice_id, line_number),
  KEY idx_il_invoice (invoice_id)
);

