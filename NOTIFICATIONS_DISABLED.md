# Notifications System Temporarily Disabled

## Status
The notifications system has been **temporarily disabled** to prevent server crashes due to MySQL parameter binding errors.

## What Was Changed

### Backend (`server/src/controllers/notificationController.js`)
All notification endpoints now return empty/mock responses without querying the database:

- ✅ `listNotifications()` - Returns `{ notifications: [], total: 0 }`
- ✅ `getUnreadCount()` - Returns `{ count: 0 }`
- ✅ `markAsRead()` - Returns mock success response
- ✅ `markAllAsRead()` - Returns mock success response
- ✅ `dismissNotification()` - Returns mock success response
- ✅ `getPreferences()` - Returns empty array `[]`
- ✅ `updatePreference()` - Returns mock success response
- ✅ `createNotification()` - Returns mock notification object (not saved to DB)

### Frontend (`client/src/hooks/useNotifications.js`)
- ✅ Hook initializes with empty state (no API calls)
- ✅ WebSocket connection disabled
- ✅ Polling disabled
- ✅ All functions return empty arrays or 0 counts

## Impact

### What Still Works
- ✅ Server starts without errors
- ✅ All other API endpoints function normally
- ✅ Master Data, Dashboard, PO Entry, Invoices, etc. all work
- ✅ Frontend renders without crashes
- ✅ No database errors

### What Doesn't Work
- ❌ Real-time notifications
- ❌ Notification badge counts (shows 0)
- ❌ Notification dropdown (empty)
- ❌ WebSocket notifications

## UI Behavior

The notification bell icon in the Navbar will:
- Show 0 unread count
- Display empty dropdown when clicked
- Not crash or show errors

## Re-enabling Notifications

To re-enable notifications in the future:

1. **Fix the MySQL parameter binding issue** in `server/src/services/notificationService.js`
2. **Restore the controller functions** to call the service instead of returning mocks
3. **Re-enable the frontend hook** to make API calls and connect WebSocket

## Files Modified

- `server/src/controllers/notificationController.js` - All functions return mocks
- `client/src/hooks/useNotifications.js` - Disabled API calls and WebSocket

## Notes

- The notification routes are still registered but return empty responses
- No database queries are executed for notifications
- The system is designed to be easily re-enabled once the MySQL issue is fixed
- All other functionality remains unaffected
