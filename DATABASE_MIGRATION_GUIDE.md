# Database Migration Guide

## Quick Start

To run database migrations on the server:

```bash
cd server
npm run migrate
```

## Prerequisites

1. **MySQL Database Server** must be running
2. **Database credentials** must be configured in `.env` file
3. **Database must exist** (migrations don't create the database itself)

## Step-by-Step Instructions

### 1. Navigate to Server Directory
```bash
cd server
```

### 2. Configure Database Connection

Create or update `.env` file in the `server` directory with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nbaurum
DB_CHARSET=utf8mb4
DB_TIMEZONE=+00:00
```

**Important:** Replace `your_password` with your actual MySQL root password (or your database user password).

### 3. Create Database (if it doesn't exist)

Connect to MySQL and create the database:

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE IF NOT EXISTS nbaurum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Run Migrations

Execute the migration script:

```bash
npm run migrate
```

**OR** directly:

```bash
node src/db/migrate.js
```

## What Happens During Migration

1. **Creates `schema_migrations` table** (if it doesn't exist) to track applied migrations
2. **Reads all `.sql` files** from `server/src/db/migrations/` directory
3. **Sorts migrations** alphabetically by filename
4. **Checks which migrations** have already been applied
5. **Runs new migrations** in order, one at a time
6. **Marks each migration** as applied after successful execution
7. **Uses transactions** - if a migration fails, it rolls back

## Migration Files

The following migration files are available (in order):

1. `001_core.sql` - Core tables (users, roles, etc.)
2. `002_master_data.sql` - Master data tables
3. `003_po.sql` - Purchase Order tables
4. `004_invoice.sql` - Invoice tables
5. `005_payments.sql` - Payment tables
6. `006_collection.sql` - Collection tables
7. `007_misc.sql` - Miscellaneous tables
8. `008_user_management.sql` - User management enhancements
9. `009_storage.sql` - File storage tables
10. `010_invoice_comprehensive.sql` - Invoice enhancements
11. `010_mom_enhancement.sql` - Minutes of Meeting enhancements
12. `011_notifications_enhanced.sql` - Notifications system
13. `012_settings_enhanced.sql` - Settings system
14. `013_alerts_enhanced.sql` - Alerts system
15. `013_support_tickets.sql` - Support tickets
16. `014_fix_users_columns.sql` - User columns fixes
17. `015_master_data_generic.sql` - Generic master data table
18. `016_add_draft_data_columns.sql` - Draft data columns

## Expected Output

When migrations run successfully, you'll see:

```
Running migration 001_core.sql
Running migration 002_master_data.sql
Running migration 003_po.sql
...
Migrations complete
```

If a migration was already applied, you'll see:

```
Skipping migration 001_core.sql (already applied)
```

## Troubleshooting

### Error: "Access denied for user"
**Solution:** Check your `.env` file credentials. Make sure:
- `DB_USER` has proper permissions
- `DB_PASSWORD` is correct
- Database user has CREATE, ALTER, INSERT, UPDATE, DELETE permissions

### Error: "Unknown database"
**Solution:** Create the database first:
```sql
CREATE DATABASE nbaurum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: "Table already exists"
**Solution:** This is normal if migrations were partially run. The migration script will skip already-applied migrations automatically.

### Error: "Migration failed"
**Solution:**
1. Check the error message for specific SQL errors
2. Verify the database connection is working
3. Check if tables/columns already exist (might need manual cleanup)
4. Review the specific migration file that failed

### Fix Partial Migrations

If migrations were partially applied, you can use the fix script:

```bash
node src/db/fix-migrations.js
```

This will mark certain migrations as applied if their changes already exist in the database.

## Verification

After migrations complete, verify the database:

```bash
mysql -u root -p nbaurum
```

Then check tables:
```sql
SHOW TABLES;
SELECT * FROM schema_migrations;
```

You should see:
- All expected tables created
- All migration files listed in `schema_migrations` table

## Re-running Migrations

Migrations are **idempotent** - you can safely run them multiple times:
- Already-applied migrations will be skipped
- Only new migrations will be executed
- No duplicate tables or data will be created

## Manual Migration (Alternative)

If you prefer to run migrations manually:

1. Connect to MySQL:
   ```bash
   mysql -u root -p nbaurum
   ```

2. Run each SQL file in order:
   ```sql
   SOURCE server/src/db/migrations/001_core.sql;
   SOURCE server/src/db/migrations/002_master_data.sql;
   -- etc.
   ```

3. Manually track applied migrations in `schema_migrations` table

## Production Deployment

For production deployments:

1. **Backup database first:**
   ```bash
   mysqldump -u root -p nbaurum > backup_before_migration.sql
   ```

2. **Test migrations on staging** environment first

3. **Run migrations during maintenance window**

4. **Verify application works** after migration

5. **Keep backup** for rollback if needed

## Notes

- Migrations run in **alphabetical order** (by filename)
- Each migration runs in a **transaction** (all or nothing)
- Migrations are tracked in `schema_migrations` table
- The migration script **closes the database connection** after completion
- For development, you can run migrations multiple times safely
