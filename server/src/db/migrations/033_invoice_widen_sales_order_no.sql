-- PO / master data can copy long "Sales Order" references; VARCHAR(100) caused ER_DATA_TOO_LONG
ALTER TABLE invoices MODIFY COLUMN sales_order_no VARCHAR(512) NULL;
