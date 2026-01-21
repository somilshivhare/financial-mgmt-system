CREATE TABLE IF NOT EXISTS collection_plans (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36) NOT NULL,
  target_date DATE NOT NULL,
  expected_amount DECIMAL(14,2) NOT NULL,
  status ENUM('planned','in_progress','done','canceled') DEFAULT 'planned',
  owner_user_id CHAR(36),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cp_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_cp_owner FOREIGN KEY (owner_user_id) REFERENCES users(id),
  KEY idx_cp_invoice (invoice_id),
  KEY idx_cp_target_date (target_date),
  KEY idx_cp_status (status)
);

CREATE TABLE IF NOT EXISTS collection_actions (
  id CHAR(36) PRIMARY KEY,
  plan_id CHAR(36) NOT NULL,
  action_date DATE NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  outcome TEXT,
  next_step TEXT,
  created_by CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ca_plan FOREIGN KEY (plan_id) REFERENCES collection_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_ca_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  KEY idx_ca_plan_action_date (plan_id, action_date)
);

