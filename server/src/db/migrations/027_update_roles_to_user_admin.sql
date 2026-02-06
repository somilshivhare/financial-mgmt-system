-- Migration: Update roles to only 'admin' and 'user'
-- This migration updates all existing users to use the new 2-role system

-- Admin credentials:
-- Email: nbaurumadmin2026@gmail.com
-- Password: Nbaurum@2026
-- Role: admin (role_id = 1)

-- Set the official admin account to admin role (if user exists)
UPDATE users 
SET role_id = 1 
WHERE email = 'nbaurumadmin2026@gmail.com';

-- Update all other users with old roles (finance, operations, sales, viewer) to 'user' role
-- This includes any existing admin users except the official admin account
UPDATE users 
SET role_id = 2 
WHERE role_id IN (2, 3, 4, 5) OR (role_id = 1 AND email != 'nbaurumadmin2026@gmail.com');

-- Note: Only nbaurumadmin2026@gmail.com will have admin role (role_id=1)
-- All other users will have user role (role_id=2)
