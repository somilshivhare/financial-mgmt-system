# User Database Documentation

## Overview
This document describes the comprehensive database structure for user management, authentication, and user details in the Nbaurum ERP system.

## Database Tables

### 1. `users` (Core User Table)
Stores basic user authentication and account information.

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `full_name` (VARCHAR(120)): User's full name
- `email` (VARCHAR(160)): Unique email address
- `password_hash` (VARCHAR(255)): Bcrypt hashed password
- `role_id` (INT): Foreign key to `roles` table
- `status` (ENUM): 'active', 'disabled', 'locked', 'suspended'
- `last_login_at` (DATETIME): Last successful login timestamp
- `last_login_ip` (VARCHAR(45)): IP address of last login
- `email_verified` (BOOLEAN): Email verification status
- `email_verified_at` (DATETIME): Email verification timestamp
- `phone_verified` (BOOLEAN): Phone verification status
- `created_by` (CHAR(36)): User who created this account
- `updated_by` (CHAR(36)): User who last updated this account
- `created_at` (DATETIME): Account creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `status`
- Index on `role_id`

### 2. `user_profiles` (Extended User Information)
Stores additional user profile details.

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id` (unique)
- `phone` (VARCHAR(20)): Phone number
- `mobile` (VARCHAR(20)): Mobile number
- `company_name` (VARCHAR(150)): Company/organization name
- `department` (VARCHAR(100)): Department
- `designation` (VARCHAR(100)): Job title/designation
- `address` (TEXT): Street address
- `city` (VARCHAR(100)): City
- `state` (VARCHAR(100)): State/Province
- `country` (VARCHAR(100)): Country (default: 'India')
- `pin_code` (VARCHAR(10)): Postal/ZIP code
- `profile_picture_url` (VARCHAR(255)): Profile picture URL
- `bio` (TEXT): User biography
- `timezone` (VARCHAR(50)): Timezone (default: 'Asia/Kolkata')
- `language` (VARCHAR(10)): Language preference (default: 'en-IN')
- `date_format` (VARCHAR(20)): Date format preference (default: 'DD MMM YYYY')
- `created_at` (DATETIME): Profile creation timestamp
- `updated_at` (DATETIME): Last update timestamp

### 3. `user_login_history` (Login Attempt Tracking)
Tracks all login attempts (successful and failed).

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id`
- `login_at` (DATETIME): Login attempt timestamp
- `ip_address` (VARCHAR(45)): IP address
- `user_agent` (TEXT): Browser user agent string
- `device_type` (VARCHAR(50)): 'desktop', 'mobile', 'tablet'
- `browser` (VARCHAR(100)): Browser name
- `os` (VARCHAR(100)): Operating system
- `location` (VARCHAR(200)): Geographic location (if available)
- `status` (ENUM): 'success' or 'failed'
- `failure_reason` (VARCHAR(255)): Reason for failure (if failed)
- `token_id` (VARCHAR(255)): Token identifier (if successful)

**Indexes:**
- Index on `user_id`
- Index on `login_at`
- Index on `status`

### 4. `user_sessions` (Active User Sessions)
Manages active user sessions and tokens.

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id`
- `token_hash` (VARCHAR(255)): Hashed JWT token
- `refresh_token_hash` (VARCHAR(255)): Hashed refresh token (optional)
- `ip_address` (VARCHAR(45)): IP address
- `user_agent` (TEXT): Browser user agent string
- `device_type` (VARCHAR(50)): Device type
- `browser` (VARCHAR(100)): Browser name
- `os` (VARCHAR(100)): Operating system
- `location` (VARCHAR(200)): Geographic location
- `is_active` (BOOLEAN): Session active status
- `expires_at` (DATETIME): Token expiration time
- `last_activity_at` (DATETIME): Last activity timestamp
- `created_at` (DATETIME): Session creation timestamp

**Indexes:**
- Index on `user_id`
- Index on `token_hash`
- Index on `is_active`
- Index on `expires_at`

### 5. `user_preferences` (User Settings)
Stores user-specific preferences and settings.

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id`
- `preference_key` (VARCHAR(100)): Preference key
- `preference_value` (TEXT): Preference value (JSON string if needed)
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Indexes:**
- Unique index on (`user_id`, `preference_key`)
- Index on `user_id`

### 6. `user_activity_log` (User Activity Tracking)
Logs important user actions for audit purposes.

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id`
- `action_type` (VARCHAR(100)): Type of action (e.g., 'invoice_created', 'payment_recorded')
- `action_description` (TEXT): Human-readable description
- `resource_type` (VARCHAR(100)): Type of resource affected (e.g., 'invoice', 'payment')
- `resource_id` (VARCHAR(100)): ID of the affected resource
- `ip_address` (VARCHAR(45)): IP address
- `user_agent` (TEXT): Browser user agent
- `metadata` (JSON): Additional metadata
- `created_at` (DATETIME): Action timestamp

**Indexes:**
- Index on `user_id`
- Index on `action_type`
- Index on `created_at`
- Index on (`resource_type`, `resource_id`)

### 7. `user_security_settings` (Security Configuration)
Manages user security settings and password policies.

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id` (unique)
- `two_factor_enabled` (BOOLEAN): 2FA enabled status
- `two_factor_secret` (VARCHAR(255)): 2FA secret key
- `password_changed_at` (DATETIME): Last password change
- `password_expires_at` (DATETIME): Password expiration date
- `failed_login_attempts` (INT): Count of failed login attempts
- `account_locked_until` (DATETIME): Account lock expiration
- `last_password_change_at` (DATETIME): Last password change timestamp
- `require_password_change` (BOOLEAN): Force password change flag
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

### 8. `password_resets` (Password Reset Tokens)
Manages password reset tokens (already exists, documented for completeness).

**Fields:**
- `id` (CHAR(36)): Primary key, UUID
- `user_id` (CHAR(36)): Foreign key to `users.id`
- `token_hash` (CHAR(64)): Hashed reset token
- `expires_at` (DATETIME): Token expiration
- `used_at` (DATETIME): When token was used
- `created_at` (DATETIME): Creation timestamp

## Services

### `userService.js`
Provides functions for:
- `getUserProfile(userId)`: Get user profile with extended information
- `upsertUserProfile(userId, profileData)`: Create or update user profile
- `logLoginAttempt(userId, loginData)`: Log login attempt
- `getUserLoginHistory(userId, limit)`: Get login history
- `createUserSession(userId, sessionData)`: Create new session
- `getActiveUserSessions(userId)`: Get all active sessions
- `deactivateSession(sessionId)`: Deactivate a session
- `deactivateAllUserSessions(userId)`: Deactivate all user sessions
- `getUserPreference(userId, key)`: Get a user preference
- `setUserPreference(userId, key, value)`: Set a user preference
- `getUserPreferences(userId)`: Get all user preferences
- `logUserActivity(userId, activityData)`: Log user activity
- `getUserActivityLog(userId, limit)`: Get activity log
- `getUserSecuritySettings(userId)`: Get security settings
- `updateUserSecuritySettings(userId, settingsData)`: Update security settings

## Migration

To apply the new database structure:

```bash
cd server
npm run migrate
```

This will run all migration files including the new `008_user_management.sql`.

## Usage Examples

### Logging in (automatically logs login attempt)
```javascript
const result = await authService.login(email, password, {
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});
```

### Getting user profile
```javascript
const profile = await userService.getUserProfile(userId);
```

### Updating user profile
```javascript
await userService.upsertUserProfile(userId, {
  phone: '+91-1234567890',
  company_name: 'Acme Corp',
  department: 'Finance',
  designation: 'Manager'
});
```

### Logging user activity
```javascript
await userService.logUserActivity(userId, {
  action_type: 'invoice_created',
  action_description: 'Created invoice #INV-001',
  resource_type: 'invoice',
  resource_id: 'invoice-id',
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});
```

## Security Features

1. **Password Security**: Bcrypt hashing with configurable rounds
2. **Login Tracking**: All login attempts (success/failure) are logged
3. **Session Management**: Active sessions tracked with device info
4. **Account Locking**: Failed login attempts can lock accounts
5. **Password Expiration**: Optional password expiration policy
6. **Two-Factor Authentication**: Support for 2FA (ready for implementation)
7. **Activity Logging**: Comprehensive audit trail of user actions

## Notes

- All timestamps use DATETIME type
- All IDs use UUID (CHAR(36))
- Foreign keys have CASCADE DELETE where appropriate
- Indexes are optimized for common query patterns
- JSON fields are used for flexible metadata storage

