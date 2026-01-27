-- Add draft_data JSON columns for storing full form data
-- This allows us to persist all form fields that aren't in the main table schema

-- Add draft_data to purchase_orders
ALTER TABLE purchase_orders 
ADD COLUMN draft_data JSON NULL 
AFTER total_amount;

-- Add draft_data to invoices  
ALTER TABLE invoices 
ADD COLUMN draft_data JSON NULL 
AFTER balance;

-- Add draft_data to payments
ALTER TABLE payments 
ADD COLUMN draft_data JSON NULL 
AFTER payment_amount;

-- Add indexes for better query performance
ALTER TABLE purchase_orders 
ADD INDEX idx_po_draft_status (status, created_by, updated_at);
