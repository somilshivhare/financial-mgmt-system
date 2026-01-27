-- Generic Master Data Table
-- Stores all master data types (company-profile, customer-profile, consignee-profile, payer-profile, employee-profile, payment-terms)
-- Uses JSON column to store flexible schema for different types

CREATE TABLE IF NOT EXISTS master_data (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(80) NOT NULL COMMENT 'Type: company-profile, customer-profile, consignee-profile, payer-profile, employee-profile, payment-terms',
  `values` JSON NOT NULL COMMENT 'Flexible JSON structure storing all form fields',
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_master_data_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_master_data_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_master_data_type (type),
  KEY idx_master_data_created_by (created_by),
  KEY idx_master_data_created_at (created_at),
  KEY idx_master_data_type_created (type, created_at)
);

