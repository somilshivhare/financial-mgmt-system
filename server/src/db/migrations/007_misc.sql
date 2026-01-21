CREATE TABLE IF NOT EXISTS meetings (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  meeting_date DATETIME NOT NULL,
  owner_user_id CHAR(36),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_meeting_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS meeting_minutes (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  item TEXT NOT NULL,
  owner_user_id CHAR(36),
  due_date DATE,
  status ENUM('open','in_progress','done') DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mm_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  CONSTRAINT fk_mm_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  alert_type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  link_url VARCHAR(255),
  status ENUM('new','read','dismissed') DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id CHAR(36) PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_by CHAR(36),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_setting_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  plan VARCHAR(80) NOT NULL,
  status ENUM('trial','active','past_due','canceled') DEFAULT 'trial',
  seats INT DEFAULT 1,
  starts_at DATE,
  ends_at DATE,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

