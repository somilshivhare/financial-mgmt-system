CREATE TABLE IF NOT EXISTS purchase_orders (
  id CHAR(36) PRIMARY KEY,
  po_number VARCHAR(80) NOT NULL UNIQUE,
  customer_id CHAR(36) NOT NULL,
  status ENUM('draft','approved','closed','cancelled') NOT NULL DEFAULT 'draft',
  currency VARCHAR(8) DEFAULT 'USD',
  issue_date DATE,
  due_date DATE,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_po_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_po_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_po_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
  KEY idx_po_customer (customer_id),
  KEY idx_po_status (status),
  KEY idx_po_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id CHAR(36) PRIMARY KEY,
  po_id CHAR(36) NOT NULL,
  line_number INT NOT NULL,
  description TEXT,
  product_id CHAR(36),
  quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pol_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_pol_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uq_pol_po_line (po_id, line_number),
  KEY idx_pol_po (po_id)
);

CREATE TABLE IF NOT EXISTS po_status_history (
  id CHAR(36) PRIMARY KEY,
  po_id CHAR(36) NOT NULL,
  from_status ENUM('draft','approved','closed','cancelled') NULL,
  to_status ENUM('draft','approved','closed','cancelled') NOT NULL,
  changed_by CHAR(36) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  CONSTRAINT fk_posh_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_posh_user FOREIGN KEY (changed_by) REFERENCES users(id),
  KEY idx_posh_po_changed_at (po_id, changed_at)
);

