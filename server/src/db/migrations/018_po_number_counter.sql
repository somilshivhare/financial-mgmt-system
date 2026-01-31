-- PO number counter per Business Unit + Financial Year
-- Generates: PO-{BU}-{FY}-{NNNN} e.g. PO-UNIT1-20252026-0001

CREATE TABLE IF NOT EXISTS po_number_counter (
  business_unit VARCHAR(20) NOT NULL,
  financial_year VARCHAR(16) NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (business_unit, financial_year)
);

