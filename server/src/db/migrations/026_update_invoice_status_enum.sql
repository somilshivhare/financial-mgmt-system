-- Update invoice status ENUM to include 'posted', 'submitted', 'active', and 'rejected'
-- These statuses are used in the application but were missing from the original ENUM

-- Modify the status column to include new values
ALTER TABLE invoices 
MODIFY COLUMN status ENUM(
  'draft',
  'open', 
  'posted',
  'submitted',
  'active',
  'paid',
  'closed',
  'overdue',
  'cancelled',
  'rejected'
) NOT NULL DEFAULT 'open';
