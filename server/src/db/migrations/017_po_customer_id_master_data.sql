-- Allow purchase_orders.customer_id to store Master Data customer record ids (master_data.id where type = 'customer-profile')
-- Drop FK to customers table so PO Entry can link to Master Data customers
-- Run this if PO submit fails with FK violation when using customers from Master Data dropdown

ALTER TABLE purchase_orders DROP FOREIGN KEY fk_po_customer;
