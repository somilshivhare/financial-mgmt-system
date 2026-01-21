CREATE TABLE IF NOT EXISTS business_units (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS segments (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(160),
  contact_phone VARCHAR(40),
  address TEXT,
  business_unit_id CHAR(36) NULL,
  segment_id CHAR(36) NULL,
  region_id CHAR(36) NULL,
  zone_id CHAR(36) NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_bu FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
  CONSTRAINT fk_customers_segment FOREIGN KEY (segment_id) REFERENCES segments(id),
  CONSTRAINT fk_customers_region FOREIGN KEY (region_id) REFERENCES regions(id),
  CONSTRAINT fk_customers_zone FOREIGN KEY (zone_id) REFERENCES zones(id),
  KEY idx_customers_name (name),
  KEY idx_customers_status (status)
);

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(80) UNIQUE,
  unit VARCHAR(20),
  unit_price DECIMAL(14,2) DEFAULT 0,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_name (name),
  KEY idx_products_status (status)
);

