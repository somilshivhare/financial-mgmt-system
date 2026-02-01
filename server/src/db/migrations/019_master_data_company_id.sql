-- Add company linkage to master_data records
-- Every non-company master-data record should reference a specific company-profile record.

-- 1) Add company_id column (nullable for backward compatibility; enforced at app-level)
-- MySQL does not support IF NOT EXISTS for columns in older versions,
-- so use a guarded dynamic statement.
SET @add_company_id = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'master_data'
        AND COLUMN_NAME = 'company_id'
    ),
    'SELECT 1',
    'ALTER TABLE master_data ADD COLUMN company_id CHAR(36) NULL AFTER type'
  )
);
PREPARE stmt_add_company_id FROM @add_company_id;
EXECUTE stmt_add_company_id;
DEALLOCATE PREPARE stmt_add_company_id;

-- 2) Indexes to speed up company-scoped queries
SET @add_idx_company = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'master_data'
        AND INDEX_NAME = 'idx_master_data_company_id'
    ),
    'SELECT 1',
    'ALTER TABLE master_data ADD KEY idx_master_data_company_id (company_id)'
  )
);
PREPARE stmt_add_idx_company FROM @add_idx_company;
EXECUTE stmt_add_idx_company;
DEALLOCATE PREPARE stmt_add_idx_company;

SET @add_idx_type_company = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'master_data'
        AND INDEX_NAME = 'idx_master_data_type_company_updated'
    ),
    'SELECT 1',
    'ALTER TABLE master_data ADD KEY idx_master_data_type_company_updated (type, company_id, updated_at)'
  )
);
PREPARE stmt_add_idx_type_company FROM @add_idx_type_company;
EXECUTE stmt_add_idx_type_company;
DEALLOCATE PREPARE stmt_add_idx_type_company;

-- 3) Self-referential FK: company_id points at the company-profile row in master_data
-- When a company-profile is deleted, cascade delete all linked module records.
SET @add_fk_company = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'master_data'
        AND CONSTRAINT_NAME = 'fk_master_data_company_id'
    ),
    'SELECT 1',
    'ALTER TABLE master_data ADD CONSTRAINT fk_master_data_company_id FOREIGN KEY (company_id) REFERENCES master_data(id) ON DELETE CASCADE'
  )
);
PREPARE stmt_add_fk_company FROM @add_fk_company;
EXECUTE stmt_add_fk_company;
DEALLOCATE PREPARE stmt_add_fk_company;

-- 4) Best-effort backfill:
-- Assign existing non-company rows to the user's most recently updated company-profile.
-- If a user has no company-profile (or created_by is NULL), company_id remains NULL.
-- MySQL does not allow "target table in FROM clause" in UPDATE; wrap subquery in derived table.
UPDATE master_data md
SET md.company_id = (
  SELECT tmp.company_id
  FROM (
    SELECT cp.id AS company_id
    FROM master_data cp
    WHERE cp.type = 'company-profile'
      AND cp.created_by = md.created_by
    ORDER BY cp.updated_at DESC, cp.created_at DESC
    LIMIT 1
  ) AS tmp
)
WHERE md.company_id IS NULL
  AND md.type <> 'company-profile'
  AND md.created_by IS NOT NULL;

