# Admin Credentials

## Official Admin Account

**Email:** `nbaurumadmin2026@gmail.com`  
**Password:** `Nbaurum@2026`  
**Role:** `admin` (role_id = 1)

---

## Important Notes

- **Only this account has admin privileges** - can see and manage all data from all users
- **All other users** have `user` role - can only see and manage their own data
- **New registrations** automatically get `user` role - admin role cannot be assigned via public registration
- **Admin role must be assigned manually** in the database by updating `role_id` to `1`

---

## How to Create/Update Admin Account

If the admin account doesn't exist, you can create it manually:

```sql
-- Check if admin user exists
SELECT id, email, role_id FROM users WHERE email = 'nbaurumadmin2026@gmail.com';

-- If it doesn't exist, create it (you'll need to hash the password first using bcrypt)
-- Or use the registration endpoint and then update the role:
UPDATE users SET role_id = 1 WHERE email = 'nbaurumadmin2026@gmail.com';
```

---

## Security

- **Never commit admin credentials to version control**
- **Change admin password regularly in production**
- **Use strong passwords** (minimum 12 characters, mix of uppercase, lowercase, numbers, symbols)
- **Admin account should be used only for system administration tasks**
