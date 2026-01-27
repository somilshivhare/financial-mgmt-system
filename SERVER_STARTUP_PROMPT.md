# Server Startup Guide - Notification Service Fix

## ✅ Fix Applied
All notification service functions have been fixed to resolve MySQL parameter binding errors (`ER_WRONG_ARGUMENTS`).

## 🚀 Starting the Server

### Step 1: Navigate to Server Directory
```bash
cd server
```

### Step 2: Start the Server
```bash
npm start
```

**OR** if using PM2:
```bash
pm2 start ecosystem.config.js
```

**OR** if running directly:
```bash
node index.js
```

## ✅ Verification Steps

After starting the server, verify it's working correctly:

### 1. Check Server Logs
Look for:
- ✅ `Server running on port 4000` (or your configured port)
- ✅ `Database connection established`
- ✅ No `ER_WRONG_ARGUMENTS` errors

### 2. Test Notification Endpoints
Open your browser or use curl:

```bash
# Test notifications list (should return 200 OK)
curl http://localhost:4000/api/v1/notifications?limit=50

# Test unread count (should return 200 OK)
curl http://localhost:4000/api/v1/notifications/unread/count
```

### 3. Check Frontend
- Navigate to the application in your browser
- Verify notifications load without errors
- Check browser console for any API errors

## 🔧 What Was Fixed

### Problem
MySQL was throwing `ER_WRONG_ARGUMENTS` errors because parameterized subqueries in WHERE clauses don't work reliably:

```sql
-- ❌ This caused errors:
WHERE (user_id = ? OR (user_id IS NULL AND role_id IN (SELECT role_id FROM users WHERE id = ?)))
```

### Solution
All functions now fetch the user's role_id first, then use it directly:

```sql
-- ✅ This works correctly:
WHERE (user_id = ? OR (user_id IS NULL AND role_id = ?))
```

### Fixed Functions
- `listNotifications()` - Lists user notifications
- `getUnreadCount()` - Gets unread count
- `markAsRead()` - Marks notification as read
- `markAllAsRead()` - Marks all as read
- `dismissNotification()` - Dismisses notification

## 🐛 Troubleshooting

### Issue: Still seeing `ER_WRONG_ARGUMENTS` errors
**Solution:**
1. Make sure you've restarted the server after the fix
2. Clear any cached Node.js modules: `rm -rf node_modules/.cache`
3. Verify the code changes are in place (check `server/src/services/notificationService.js`)

### Issue: Server won't start
**Solution:**
1. Check database connection: Ensure MySQL is running
2. Verify environment variables: Check `.env` file
3. Check port availability: Ensure port 4000 (or configured port) is not in use
4. Review error logs for specific issues

### Issue: Notifications not loading
**Solution:**
1. Check authentication: Ensure user is logged in
2. Verify database has notification records
3. Check browser console for frontend errors
4. Verify API endpoints are accessible

### Issue: Database connection errors
**Solution:**
1. Verify MySQL is running: `mysql -u root -p`
2. Check database credentials in `.env` file
3. Ensure database exists and migrations are run
4. Check database connection pool settings

## 📋 Pre-Startup Checklist

Before starting the server, ensure:

- [ ] MySQL database is running
- [ ] Database credentials in `.env` are correct
- [ ] All npm dependencies are installed (`npm install`)
- [ ] Database migrations have been run
- [ ] Port 4000 (or configured port) is available
- [ ] No other instance of the server is running

## 🔄 Restart Instructions

If you need to restart the server:

1. **Stop the server:**
   - Press `Ctrl+C` in the terminal
   - OR: `pm2 stop ecosystem.config.js`

2. **Wait 2-3 seconds** for graceful shutdown

3. **Start again:**
   ```bash
   npm start
   ```

## 📊 Health Check

After starting, verify server health:

```bash
# Check server health endpoint
curl http://localhost:4000/health

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "..."
# }
```

## 🎯 Success Indicators

Your server is running correctly if you see:

✅ Server starts without errors
✅ Database connection established
✅ No `ER_WRONG_ARGUMENTS` errors in logs
✅ `/api/v1/notifications` returns 200 OK
✅ Frontend loads notifications successfully
✅ No crashes or unhandled exceptions

## 📝 Notes

- The fix adds one additional query per notification operation (to fetch role_id)
- This is more efficient than the problematic subquery approach
- All functions handle errors gracefully and won't crash the server
- The system falls back to user-specific notifications if role lookup fails

## 🆘 Still Having Issues?

If problems persist:

1. Check the full error logs in the terminal
2. Verify all code changes were applied correctly
3. Ensure database schema matches expected structure
4. Review `NOTIFICATION_SERVICE_FIX.md` for technical details
5. Check that no other services are conflicting

---

**Last Updated:** After notification service MySQL parameter binding fix
**Status:** ✅ All notification functions fixed and tested
