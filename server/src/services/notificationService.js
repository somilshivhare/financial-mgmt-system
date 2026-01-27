const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

/**
 * Notification types and their default configurations
 */
const NOTIFICATION_TYPES = {
  INVOICE_CREATED: 'invoice_created',
  INVOICE_APPROVAL_PENDING: 'invoice_approval_pending',
  PAYMENT_DUE: 'payment_due',
  PAYMENT_OVERDUE: 'payment_overdue',
  PAYMENT_RECEIVED: 'payment_received',
  MASTER_DATA_CHANGED: 'master_data_changed',
  PO_CREATED: 'po_created',
  PO_APPROVAL_PENDING: 'po_approval_pending',
  PO_APPROVED: 'po_approved',
  COLLECTION_FOLLOWUP: 'collection_followup',
  SYSTEM_ACTION: 'system_action',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
};

/**
 * Priority levels
 */
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Get notification priority based on type
 */
const getPriorityForType = (type) => {
  const highPriorityTypes = [
    NOTIFICATION_TYPES.PAYMENT_OVERDUE,
    NOTIFICATION_TYPES.INVOICE_APPROVAL_PENDING,
    NOTIFICATION_TYPES.COLLECTION_FOLLOWUP,
  ];
  const criticalTypes = [
    NOTIFICATION_TYPES.ADMIN_ANNOUNCEMENT,
  ];
  
  if (criticalTypes.includes(type)) return PRIORITY.CRITICAL;
  if (highPriorityTypes.includes(type)) return PRIORITY.HIGH;
  return PRIORITY.MEDIUM;
};

/**
 * Get users who should receive this notification based on role
 */
const getTargetUsers = async (roleId, excludeUserId = null) => {
  if (roleId) {
    const where = excludeUserId 
      ? 'role_id = ? AND id != ? AND status = "active"'
      : 'role_id = ? AND status = "active"';
    const params = excludeUserId ? [roleId, excludeUserId] : [roleId];
    return query(`SELECT id FROM users WHERE ${where}`, params);
  }
  // If no roleId, return all active users (for global notifications)
  const where = excludeUserId 
    ? 'id != ? AND status = "active"'
    : 'status = "active"';
  const params = excludeUserId ? [excludeUserId] : [];
  return query(`SELECT id FROM users WHERE ${where}`, params);
};

/**
 * Check if user has this notification type enabled
 */
const isNotificationEnabled = async (userId, notificationType) => {
  const [prefs] = await query(
    'SELECT enabled FROM notification_preferences WHERE user_id = ? AND notification_type = ?',
    [userId, notificationType]
  );
  // Default to enabled if no preference exists
  return prefs ? prefs.enabled : true;
};

/**
 * Create a notification
 */
const createNotification = async ({
  userId = null,
  roleId = null,
  type,
  message,
  referenceType = null,
  referenceId = null,
  priority = null,
  linkUrl = null,
  metadata = null,
  createdBy = null,
}) => {
  const notificationId = uuidv4();
  const notificationPriority = priority || getPriorityForType(type);
  
  await query(
    `INSERT INTO notifications 
     (id, user_id, role_id, type, message, reference_type, reference_id, priority, link_url, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      notificationId,
      userId,
      roleId,
      type,
      message,
      referenceType,
      referenceId,
      notificationPriority,
      linkUrl,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );

  const [notification] = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
  return notification;
};

/**
 * Create notifications for multiple users (role-based or specific users)
 */
const createNotifications = async ({
  userIds = null,
  roleId = null,
  type,
  message,
  referenceType = null,
  referenceId = null,
  priority = null,
  linkUrl = null,
  metadata = null,
  excludeUserId = null,
}) => {
  const notifications = [];
  
  // Get target users
  let targetUserIds = [];
  
  if (userIds && Array.isArray(userIds)) {
    targetUserIds = userIds;
  } else if (roleId) {
    const roleUsers = await getTargetUsers(roleId, excludeUserId);
    targetUserIds = roleUsers.map(u => u.id);
  } else {
    // Global notification - notify all active users
    const allUsers = await getTargetUsers(null, excludeUserId);
    targetUserIds = allUsers.map(u => u.id);
  }
  
  // Filter by notification preferences and create notifications
  const websocketService = require('./websocketService');
  
  for (const targetUserId of targetUserIds) {
    const enabled = await isNotificationEnabled(targetUserId, type);
    if (enabled) {
      const notification = await createNotification({
        userId: targetUserId,
        type,
        message,
        referenceType,
        referenceId,
        priority,
        linkUrl,
        metadata,
      });
      notifications.push(notification);
    }
  }
  
  // If role-based notification, also emit to role room
  if (roleId && notifications.length > 0) {
    try {
      const roles = await query('SELECT name FROM roles WHERE id = ?', [roleId]);
      if (roles.length > 0) {
        const roleName = roles[0].name;
        websocketService.sendNotificationToRole(roleName, {
          type: 'notification',
          notificationType: type,
          message,
          referenceType,
          referenceId,
          priority: priority || getPriorityForType(type),
          linkUrl,
        });
      }
    } catch (error) {
      console.error('[NotificationService] Error sending role-based WebSocket notification:', error);
    }
  }
  
  return notifications;
};

/**
 * Helper function to get user's role_id (cached for performance)
 * This avoids subquery parameter binding issues in MySQL
 */
const getUserRoleId = async (userId) => {
  try {
    const [user] = await query('SELECT role_id FROM users WHERE id = ?', [userId]);
    return user && user.role_id ? user.role_id : null;
  } catch (error) {
    console.error('[NotificationService] Error fetching user role:', error);
    return null;
  }
};

/**
 * List notifications for a user
 */
const listNotifications = async (userId, { 
  status = null, 
  type = null, 
  limit = 50, 
  offset = 0,
  unreadOnly = false 
} = {}) => {
  // Get the user's role_id to avoid subquery parameter binding issues
  const userRoleId = await getUserRoleId(userId);
  
  // Build WHERE clause - use role_id directly instead of subquery
  const where = ['user_id = ?'];
  const params = [userId];
  
  // Add role-based notifications if user has a role
  if (userRoleId) {
    where.push('(user_id IS NULL AND role_id = ?)');
    params.push(userRoleId);
  }
  
  // Combine conditions with OR
  const baseWhere = where.length > 1 
    ? `(${where.join(' OR ')})`
    : where[0];
  
  const whereConditions = [baseWhere];
  const whereParams = [...params];
  
  // Handle status filter - avoid duplicate conditions
  if (unreadOnly) {
    whereConditions.push('status = ?');
    whereParams.push('new');
  } else if (status) {
    whereConditions.push('status = ?');
    whereParams.push(status);
  }
  
  if (type) {
    whereConditions.push('type = ?');
    whereParams.push(type);
  }
  
  const whereSql = whereConditions.join(' AND ');
  
  // Ensure limit and offset are valid numbers
  const safeLimit = parseInt(limit, 10) || 50;
  const safeOffset = parseInt(offset, 10) || 0;
  
  const notifications = await query(
    `SELECT * FROM notifications 
     WHERE ${whereSql}
     ORDER BY 
       CASE priority 
         WHEN 'critical' THEN 1 
         WHEN 'high' THEN 2 
         WHEN 'medium' THEN 3 
         WHEN 'low' THEN 4 
       END,
       created_at DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, safeLimit, safeOffset]
  );
  
  const countResult = await query(
    `SELECT COUNT(*) as total FROM notifications WHERE ${whereSql}`,
    whereParams
  );
  
  // Safely extract total count
  const total = countResult && countResult.length > 0 
    ? (typeof countResult[0].total === 'number' 
        ? countResult[0].total 
        : parseInt(countResult[0].total, 10) || 0)
    : 0;
  
  return { notifications: notifications || [], total };
};

/**
 * Get unread count for a user
 */
const getUnreadCount = async (userId) => {
  try {
    const userRoleId = await getUserRoleId(userId);
    
    // Build WHERE clause
    let whereClause = 'user_id = ?';
    const params = [userId];
    
    if (userRoleId) {
      whereClause = '(user_id = ? OR (user_id IS NULL AND role_id = ?))';
      params.push(userRoleId);
    }
    
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE ${whereClause} AND status = 'new'`,
      params
    );
    
    // Ensure we return a number, handle empty results
    if (!result || result.length === 0) {
      return 0;
    }
    
    const count = result[0]?.count;
    // Convert to number if it's a string (MySQL sometimes returns strings)
    return typeof count === 'number' ? count : parseInt(count, 10) || 0;
  } catch (error) {
    console.error('[NotificationService] Error getting unread count:', error);
    // Return 0 on error instead of throwing
    return 0;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const userRoleId = await getUserRoleId(userId);
  
  // Build WHERE clause
  let whereClause = 'id = ? AND user_id = ?';
  const params = [notificationId, userId];
  
  if (userRoleId) {
    whereClause = 'id = ? AND (user_id = ? OR (user_id IS NULL AND role_id = ?))';
    params.push(userRoleId);
  }
  
  await query(
    `UPDATE notifications 
     SET status = 'read', read_at = NOW(), updated_at = NOW()
     WHERE ${whereClause}`,
    params
  );
  const [notification] = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const userRoleId = await getUserRoleId(userId);
  
  // Build WHERE clause
  let whereClause = 'user_id = ?';
  const params = [userId];
  
  if (userRoleId) {
    whereClause = '(user_id = ? OR (user_id IS NULL AND role_id = ?))';
    params.push(userRoleId);
  }
  
  await query(
    `UPDATE notifications 
     SET status = 'read', read_at = NOW(), updated_at = NOW()
     WHERE ${whereClause} AND status = 'new'`,
    params
  );
  return { success: true };
};

/**
 * Dismiss notification
 */
const dismissNotification = async (notificationId, userId) => {
  const userRoleId = await getUserRoleId(userId);
  
  // Build WHERE clause
  let whereClause = 'id = ? AND user_id = ?';
  const params = [notificationId, userId];
  
  if (userRoleId) {
    whereClause = 'id = ? AND (user_id = ? OR (user_id IS NULL AND role_id = ?))';
    params.push(userRoleId);
  }
  
  await query(
    `UPDATE notifications 
     SET status = 'dismissed', dismissed_at = NOW(), updated_at = NOW()
     WHERE ${whereClause}`,
    params
  );
  const [notification] = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
  return notification;
};

/**
 * Get notification preferences for a user
 */
const getNotificationPreferences = async (userId) => {
  const prefs = await query(
    'SELECT notification_type, enabled, email_enabled FROM notification_preferences WHERE user_id = ?',
    [userId]
  );
  return prefs;
};

/**
 * Update notification preference
 */
const updateNotificationPreference = async (userId, notificationType, { enabled = true, emailEnabled = false }) => {
  const id = uuidv4();
  await query(
    `INSERT INTO notification_preferences (id, user_id, notification_type, enabled, email_enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE enabled = ?, email_enabled = ?, updated_at = NOW()`,
    [id, userId, notificationType, enabled, emailEnabled, enabled, emailEnabled]
  );
  const [pref] = await query(
    'SELECT * FROM notification_preferences WHERE user_id = ? AND notification_type = ?',
    [userId, notificationType]
  );
  return pref;
};

/**
 * Initialize default preferences for a user
 */
const initializeUserPreferences = async (userId) => {
  const defaultTypes = Object.values(NOTIFICATION_TYPES);
  const existing = await query(
    'SELECT notification_type FROM notification_preferences WHERE user_id = ?',
    [userId]
  );
  const existingTypes = existing.map(p => p.notification_type);
  
  for (const type of defaultTypes) {
    if (!existingTypes.includes(type)) {
      await updateNotificationPreference(userId, type, { enabled: true, emailEnabled: false });
    }
  }
};

/**
 * Event-specific notification creators
 */

// Invoice created
const notifyInvoiceCreated = async (invoice, createdBy) => {
  const message = `New invoice ${invoice.invoice_number} created for ₹${parseFloat(invoice.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
  // Notify finance and admin roles
  return createNotifications({
    roleId: 2, // finance
    type: NOTIFICATION_TYPES.INVOICE_CREATED,
    message,
    referenceType: 'invoice',
    referenceId: invoice.id,
    linkUrl,
    metadata: { invoice_number: invoice.invoice_number, amount: invoice.total_amount },
    excludeUserId: createdBy,
  });
};

// Invoice approval pending
const notifyInvoiceApprovalPending = async (invoice) => {
  const message = `Invoice ${invoice.invoice_number} is pending approval`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
  // Notify finance and admin roles
  return createNotifications({
    roleId: 2, // finance
    type: NOTIFICATION_TYPES.INVOICE_APPROVAL_PENDING,
    message,
    referenceType: 'invoice',
    referenceId: invoice.id,
    linkUrl,
    priority: PRIORITY.HIGH,
    metadata: { invoice_number: invoice.invoice_number },
  });
};

// Payment due
const notifyPaymentDue = async (invoice) => {
  const message = `Payment due for invoice ${invoice.invoice_number}: ₹${parseFloat(invoice.balance || invoice.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
  // Notify finance and collection roles
  return createNotifications({
    roleId: 2, // finance
    type: NOTIFICATION_TYPES.PAYMENT_DUE,
    message,
    referenceType: 'invoice',
    referenceId: invoice.id,
    linkUrl,
    priority: PRIORITY.HIGH,
    metadata: { invoice_number: invoice.invoice_number, amount: invoice.balance || invoice.total_amount },
  });
};

// Payment overdue
const notifyPaymentOverdue = async (invoice) => {
  const daysOverdue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
  const message = `Payment overdue for invoice ${invoice.invoice_number} by ${daysOverdue} days: ₹${parseFloat(invoice.balance || invoice.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
  // Notify finance and collection roles
  return createNotifications({
    roleId: 2, // finance
    type: NOTIFICATION_TYPES.PAYMENT_OVERDUE,
    message,
    referenceType: 'invoice',
    referenceId: invoice.id,
    linkUrl,
    priority: PRIORITY.CRITICAL,
    metadata: { invoice_number: invoice.invoice_number, amount: invoice.balance || invoice.total_amount, days_overdue: daysOverdue },
  });
};

// Payment received
const notifyPaymentReceived = async (payment, invoice) => {
  const message = `Payment received for invoice ${invoice.invoice_number}: ₹${parseFloat(payment.amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/payments/view/${payment.id}`;
  
  // Notify finance role
  return createNotifications({
    roleId: 2, // finance
    type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    message,
    referenceType: 'payment',
    referenceId: payment.id,
    linkUrl,
    metadata: { invoice_number: invoice.invoice_number, payment_amount: payment.amount },
  });
};

// PO created
const notifyPOCreated = async (po, createdBy) => {
  const message = `New PO ${po.po_number} created for ₹${parseFloat(po.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/po-entry/view/${po.id}`;
  
  // Notify operations and admin roles
  return createNotifications({
    roleId: 3, // operations
    type: NOTIFICATION_TYPES.PO_CREATED,
    message,
    referenceType: 'po',
    referenceId: po.id,
    linkUrl,
    metadata: { po_number: po.po_number, amount: po.total_amount },
    excludeUserId: createdBy,
  });
};

// PO approval pending
const notifyPOApprovalPending = async (po) => {
  const message = `PO ${po.po_number} is pending approval`;
  const linkUrl = `/po-entry/view/${po.id}`;
  
  // Notify operations and admin roles
  return createNotifications({
    roleId: 3, // operations
    type: NOTIFICATION_TYPES.PO_APPROVAL_PENDING,
    message,
    referenceType: 'po',
    referenceId: po.id,
    linkUrl,
    priority: PRIORITY.HIGH,
    metadata: { po_number: po.po_number },
  });
};

// PO approved
const notifyPOApproved = async (po, approvedBy) => {
  const message = `PO ${po.po_number} has been approved`;
  const linkUrl = `/po-entry/view/${po.id}`;
  
  // Notify sales and operations roles
  return createNotifications({
    roleId: 4, // sales
    type: NOTIFICATION_TYPES.PO_APPROVED,
    message,
    referenceType: 'po',
    referenceId: po.id,
    linkUrl,
    metadata: { po_number: po.po_number },
    excludeUserId: approvedBy,
  });
};

// Master data changed
const notifyMasterDataChanged = async (entityType, entityId, entityName, changedBy) => {
  const message = `Master data updated: ${entityType} "${entityName}" has been modified`;
  const linkUrl = `/master-data/view/${entityId}`;
  
  // Notify admin and finance roles (most relevant for master data changes)
  return createNotifications({
    roleId: 1, // admin
    type: NOTIFICATION_TYPES.MASTER_DATA_CHANGED,
    message,
    referenceType: 'master_data',
    referenceId: entityId,
    linkUrl,
    metadata: { entity_type: entityType, entity_name: entityName },
    excludeUserId: changedBy,
  });
};

// Collection follow-up
const notifyCollectionFollowup = async (invoice, followupMessage) => {
  const message = followupMessage || `Collection follow-up required for invoice ${invoice.invoice_number}`;
  const linkUrl = `/collections/view/${invoice.id}`;
  
  // Notify finance and collection roles
  return createNotifications({
    roleId: 2, // finance
    type: NOTIFICATION_TYPES.COLLECTION_FOLLOWUP,
    message,
    referenceType: 'invoice',
    referenceId: invoice.id,
    linkUrl,
    priority: PRIORITY.HIGH,
    metadata: { invoice_number: invoice.invoice_number },
  });
};

// Admin announcement
const notifyAdminAnnouncement = async (message, linkUrl = null, metadata = null, createdBy = null) => {
  // Notify all users (global notification)
  const allUsers = await query('SELECT id FROM users WHERE status = "active"', []);
  const userIds = allUsers.map(u => u.id);
  
  return createNotifications({
    userIds,
    type: NOTIFICATION_TYPES.ADMIN_ANNOUNCEMENT,
    message,
    linkUrl,
    priority: PRIORITY.CRITICAL,
    metadata,
    excludeUserId: createdBy,
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  PRIORITY,
  createNotification,
  createNotifications,
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getNotificationPreferences,
  updateNotificationPreference,
  initializeUserPreferences,
  // Event-specific creators
  notifyInvoiceCreated,
  notifyInvoiceApprovalPending,
  notifyPaymentDue,
  notifyPaymentOverdue,
  notifyPaymentReceived,
  notifyPOCreated,
  notifyPOApprovalPending,
  notifyPOApproved,
  notifyMasterDataChanged,
  notifyCollectionFollowup,
  notifyAdminAnnouncement,
};

