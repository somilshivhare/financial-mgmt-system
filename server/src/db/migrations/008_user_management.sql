-- User Profiles: Extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  phone VARCHAR(20),
  mobile VARCHAR(20),
  company_name VARCHAR(150),
  department VARCHAR(100),
  designation VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pin_code VARCHAR(10),
  profile_picture_url VARCHAR(255),
  bio TEXT,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  language VARCHAR(10) DEFAULT 'en-IN',
  date_format VARCHAR(20) DEFAULT 'DD MMM YYYY',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_profiles_user (user_id)
);

-- User Login History: Track all login attempts
CREATE TABLE IF NOT EXISTS user_login_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  location VARCHAR(200),
  status ENUM('success','failed') NOT NULL DEFAULT 'success',
  failure_reason VARCHAR(255),
  token_id VARCHAR(255),
  CONSTRAINT fk_login_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_login_history_user (user_id),
  KEY idx_login_history_login_at (login_at),
  KEY idx_login_history_status (status)
);

-- User Sessions: Active user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  location VARCHAR(200),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at DATETIME NOT NULL,
  last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_token (token_hash),
  KEY idx_user_sessions_active (is_active),
  KEY idx_user_sessions_expires (expires_at)
);

-- User Preferences: User-specific settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  preference_key VARCHAR(100) NOT NULL,
  preference_value TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_preferences_user_key (user_id, preference_key),
  KEY idx_user_preferences_user (user_id)
);

-- User Activity Log: Track important user actions
CREATE TABLE IF NOT EXISTS user_activity_log (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_activity_log_user (user_id),
  KEY idx_user_activity_log_action (action_type),
  KEY idx_user_activity_log_created (created_at),
  KEY idx_user_activity_log_resource (resource_type, resource_id)
);

-- Add additional fields to users table if they don't exist
-- Note: These ALTER TABLE statements will only add columns if they don't exist
-- MySQL doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle this in application code
-- For now, we'll create a separate migration approach

-- User Security Settings: Password and security preferences
CREATE TABLE IF NOT EXISTS user_security_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  password_changed_at DATETIME,
  password_expires_at DATETIME,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  account_locked_until DATETIME NULL,
  last_password_change_at DATETIME,
  require_password_change BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_security_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_security_settings_user (user_id)
);

