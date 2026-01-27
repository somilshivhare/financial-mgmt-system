# Notification Service MySQL Parameter Binding Fix

## Problem
The notification service was experiencing `ER_WRONG_ARGUMENTS: Incorrect arguments to mysqld_stmt_execute` errors due to MySQL's inability to properly bind parameters in subqueries within WHERE clauses.

**Error Pattern:**
```sql
WHERE (user_id = ? OR (user_id IS NULL AND role_id IN (SELECT role_id FROM users WHERE id = ?)))
```

MySQL's prepared statement system has issues with parameterized subqueries, causing parameter count mismatches.

## Solution
All notification service functions have been refactored to:
1. **Fetch user's role_id first** in a separate, simple query
2. **Use the role_id directly** in WHERE clauses instead of subqueries
3. **Handle cases gracefully** where user lookup fails

## Fixed Functions
- ✅ `listNotifications()` - Lists notifications for a user
- ✅ `getUnreadCount()` - Gets unread notification count
- ✅ `markAsRead()` - Marks a notification as read
- ✅ `markAllAsRead()` - Marks all notifications as read
- ✅ `dismissNotification()` - Dismisses a notification

## Implementation Details

### Helper Function
```javascript
const getUserRoleId = async (userId) => {
  try {
    const [user] = await query('SELECT role_id FROM users WHERE id = ?', [userId]);
    return user && user.role_id ? user.role_id : null;
  } catch (error) {
    console.error('[NotificationService] Error fetching user role:', error);
    return null;
  }
};
```

### Before (Problematic)
```sql
WHERE (user_id = ? OR (user_id IS NULL AND role_id IN (SELECT role_id FROM users WHERE id = ?)))
```

### After (Fixed)
```sql
WHERE (user_id = ? OR (user_id IS NULL AND role_id = ?))
-- role_id is fetched beforehand
```

## Testing
After restarting the server, verify:
1. ✅ `/api/v1/notifications?limit=50` returns 200 OK
2. ✅ `/api/v1/notifications/unread/count` returns 200 OK
3. ✅ No `ER_WRONG_ARGUMENTS` errors in server logs
4. ✅ Notifications load correctly in the frontend

## Server Restart Required
**IMPORTANT:** The server must be restarted for these changes to take effect.

### To restart the server:
1. Stop the current server (Ctrl+C)
2. Start the server again:
   ```bash
   cd server
   npm start
   # or
   node index.js
   ```

## Performance Notes
- The fix adds one additional query per notification operation to fetch the user's role_id
- This is more efficient than the problematic subquery approach
- Consider caching user role_ids if performance becomes an issue (future optimization)

## Error Handling
All functions now gracefully handle:
- Missing user records
- Database connection errors
- Invalid user IDs
- Missing role_id values

The system will continue to work even if role-based notifications cannot be determined, falling back to user-specific notifications only.
