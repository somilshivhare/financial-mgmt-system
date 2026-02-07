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

## What admin can see and do

Compared to a regular **user** (who only sees and manages their own data in scoped areas), **admin** has the following:

| Area | Admin | User |
|------|--------|------|
| **Invoices** | All invoices (no filter by creator) | Only invoices they created |
| **Purchase orders (POs)** | All POs | Only POs they created |
| **Payments** | All payments (list is not user-scoped) | All payments (same list) |
| **Dashboard** | Org-wide KPIs and lists | Org-wide (dashboard is not user-scoped) |
| **Reports** | All reports; can omit `userId` for org-wide; **Audit log** is admin-only | Reports with optional `userId` filter (own data) |
| **Settings** | **Admin-only**: view/edit app settings, financial year check, reset, settings audit log | Cannot access settings API (403) |
| **Support tickets** | All tickets; can **assign** and set **priority** | Own tickets only |
| **Notifications** | Can **create** notifications (e.g. admin announcements) | Can only view/dismiss |
| **User profile** | Can change **company name** for any user | Can only edit own profile; company name read-only |

**UI:** Settings and Reports appear in the sidebar for everyone; non-admin users get 403 when opening Settings or the Audit log report. Dashboard quick actions (Create Invoice, Record Payment, Add Customer, Create PO) are shown to admin; other roles see a subset.

---

## How to Create/Update Admin Account

**Recommended:** Run the seed script from the server directory (creates the admin user if missing, or updates password and role if it exists):

```bash
cd server
node scripts/seed-admin.js
```

This uses the same bcrypt settings as the app and ensures login works with the credentials above.

**Manual (SQL):** If you prefer to do it manually:

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
