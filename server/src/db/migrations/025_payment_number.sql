-- Payment number counter per Financial Year
-- Generates: PAY-{FY}-{NNNN} e.g. PAY-20252026-0001

CREATE TABLE IF NOT EXISTS payment_number_counter (
  financial_year VARCHAR(16) NOT NULL PRIMARY KEY,
  counter INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add payment_number column to payments table
ALTER TABLE payments 
ADD COLUMN payment_number VARCHAR(50) NULL AFTER id,
ADD UNIQUE KEY uq_payments_payment_number (payment_number),
ADD KEY idx_payments_payment_number (payment_number);
