-- Migration: Fix roles table to ensure only 'admin' and 'user' roles exist
-- This migration ensures the roles table has the correct role names matching the role_ids

-- First, update any users with invalid role_ids to 'user' role (role_id=2)
UPDATE users 
SET role_id = 2 
WHERE role_id NOT IN (1, 2);

-- Update role names to ensure they match the expected values
-- Update role with id=1 to 'admin' if it exists
UPDATE roles SET name = 'admin' WHERE id = 1;

-- Update role with id=2 to 'user' if it exists  
UPDATE roles SET name = 'user' WHERE id = 2;

-- Ensure 'admin' role exists with id=1 (if it doesn't exist, insert it)
INSERT INTO roles (id, name) VALUES (1, 'admin')
ON DUPLICATE KEY UPDATE name = 'admin';

-- Ensure 'user' role exists with id=2 (if it doesn't exist, insert it)
INSERT INTO roles (id, name) VALUES (2, 'user')
ON DUPLICATE KEY UPDATE name = 'user';
