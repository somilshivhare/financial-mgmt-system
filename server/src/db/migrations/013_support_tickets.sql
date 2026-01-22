-- Support Tickets System Migration
-- This migration creates tables for support ticket management with full audit trail

-- Support Tickets: Main table for tracking support requests
CREATE TABLE IF NOT EXISTS support_tickets (
  id CHAR(36) PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Auto-generated ticket number (e.g., TCK-2024-00001)',
  user_id CHAR(36) NOT NULL COMMENT 'User who created the ticket',
  category ENUM('Billing', 'Invoice', 'Payment', 'PO', 'Access', 'Bug', 'Other') NOT NULL,
  priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_to CHAR(36) NULL COMMENT 'Admin/support staff assigned to handle the ticket',
  resolution_notes TEXT NULL COMMENT 'Internal notes about resolution',
  resolved_at DATETIME NULL,
  resolved_by CHAR(36) NULL,
  closed_at DATETIME NULL,
  closed_by CHAR(36) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_ticket_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_support_ticket_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_support_ticket_closed_by FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_support_ticket_number (ticket_number),
  KEY idx_support_ticket_user (user_id),
  KEY idx_support_ticket_status (status),
  KEY idx_support_ticket_priority (priority),
  KEY idx_support_ticket_category (category),
  KEY idx_support_ticket_assigned (assigned_to),
  KEY idx_support_ticket_created (created_at),
  KEY idx_support_ticket_user_status (user_id, status),
  KEY idx_support_ticket_status_priority (status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Ticket Attachments: Store file references for ticket attachments
CREATE TABLE IF NOT EXISTS support_ticket_attachments (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  storage_file_id CHAR(36) NULL COMMENT 'Reference to storage_files table if using centralized storage',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL COMMENT 'Path to file on server or storage provider',
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_attachment_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_attachment_storage FOREIGN KEY (storage_file_id) REFERENCES storage_files(id) ON DELETE SET NULL,
  CONSTRAINT fk_support_attachment_uploaded FOREIGN KEY (uploaded_by) REFERENCES users(id),
  KEY idx_support_attachment_ticket (ticket_id),
  KEY idx_support_attachment_storage (storage_file_id),
  KEY idx_support_attachment_uploaded (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Ticket Replies: Track all replies/comments on tickets (both user and admin)
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL COMMENT 'User who posted the reply',
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE COMMENT 'TRUE for admin/internal notes, FALSE for user-visible replies',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_reply_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_reply_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_support_reply_ticket (ticket_id),
  KEY idx_support_reply_user (user_id),
  KEY idx_support_reply_created (created_at),
  KEY idx_support_reply_ticket_created (ticket_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Ticket History: Complete audit trail of all status changes and updates
CREATE TABLE IF NOT EXISTS support_ticket_history (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  changed_by CHAR(36) NOT NULL,
  change_type ENUM('created', 'status_changed', 'priority_changed', 'assigned', 'replied', 'resolved', 'closed', 'reopened') NOT NULL,
  old_value VARCHAR(255) NULL COMMENT 'Previous value (e.g., old status)',
  new_value VARCHAR(255) NULL COMMENT 'New value (e.g., new status)',
  change_description TEXT NULL COMMENT 'Human-readable description of the change',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_history_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_support_history_ticket (ticket_id),
  KEY idx_support_history_changed_by (changed_by),
  KEY idx_support_history_type (change_type),
  KEY idx_support_history_created (created_at),
  KEY idx_support_history_ticket_created (ticket_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Ticket Counter: Track ticket number sequence per year
CREATE TABLE IF NOT EXISTS support_ticket_counter (
  year INT NOT NULL PRIMARY KEY,
  counter INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize current year counter
INSERT IGNORE INTO support_ticket_counter (year, counter) VALUES (YEAR(NOW()), 0);

