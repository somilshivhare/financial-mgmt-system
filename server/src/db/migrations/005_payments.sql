CREATE TABLE IF NOT EXISTS payment_advices (
  id CHAR(36) PRIMARY KEY,
  advice_number VARCHAR(80) UNIQUE,
  customer_id CHAR(36) NOT NULL,
  received_at DATE NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('draft','posted','cancelled') NOT NULL DEFAULT 'posted',
  created_by CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pa_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_pa_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  KEY idx_pa_customer (customer_id),
  KEY idx_pa_received_at (received_at),
  KEY idx_pa_status (status)
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  payment_advice_id CHAR(36) NULL,
  amount DECIMAL(14,2) NOT NULL,
  method VARCHAR(50),
  reference VARCHAR(120),
  paid_at DATE NOT NULL,
  status ENUM('pending','cleared','failed') DEFAULT 'pending',
  -- Deductions/charges for audit + reporting
  tds DECIMAL(14,2) DEFAULT 0,
  bank_charges DECIMAL(14,2) DEFAULT 0,
  penalty DECIMAL(14,2) DEFAULT 0,
  other_deductions DECIMAL(14,2) DEFAULT 0,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_pay_advice FOREIGN KEY (payment_advice_id) REFERENCES payment_advices(id),
  CONSTRAINT fk_pay_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  KEY idx_pay_invoice (invoice_id),
  KEY idx_pay_paid_at (paid_at),
  KEY idx_pay_status (status)
);

