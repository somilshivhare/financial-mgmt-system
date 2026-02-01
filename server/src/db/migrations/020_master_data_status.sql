-- Add status to master_data records for draft/published workflows
-- Defaults to published for all existing rows.

ALTER TABLE master_data
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'published' AFTER company_id;

ALTER TABLE master_data
  ADD KEY idx_master_data_status (status),
  ADD KEY idx_master_data_type_status_updated (type, status, updated_at);

-- Backfill any legacy rows to published
UPDATE master_data
SET status = 'published'
WHERE status IS NULL OR status = '';
