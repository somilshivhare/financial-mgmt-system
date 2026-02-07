const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

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

const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

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

const getTargetUsers = async (roleId, excludeUserId = null) => {
  if (roleId) {
    const where = excludeUserId 
      ? 'role_id = ? AND id != ? AND status = "active"'
      : 'role_id = ? AND status = "active"';
    const params = excludeUserId ? [roleId, excludeUserId] : [roleId];
    return query(`SELECT id FROM users WHERE ${where}`, params);
  }
  const where = excludeUserId 
    ? 'id != ? AND status = "active"'
    : 'status = "active"';
  const params = excludeUserId ? [excludeUserId] : [];
  return query(`SELECT id FROM users WHERE ${where}`, params);
};

const isNotificationEnabled = async (userId, notificationType) => {
  const [prefs] = await query(
    'SELECT enabled FROM notification_preferences WHERE user_id = ? AND notification_type = ?',
    [userId, notificationType]
  );
  return prefs ? prefs.enabled : true;
};

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
  
  let targetUserIds = [];
  
  if (userIds && Array.isArray(userIds)) {
    targetUserIds = userIds;
  } else if (roleId) {
    const roleUsers = await getTargetUsers(roleId, excludeUserId);
    targetUserIds = roleUsers.map(u => u.id);
  } else {
    const allUsers = await getTargetUsers(null, excludeUserId);
    targetUserIds = allUsers.map(u => u.id);
  }
  
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

const getUserRoleId = async (userId) => {
  try {
    const [user] = await query('SELECT role_id FROM users WHERE id = ?', [userId]);
    return user && user.role_id ? user.role_id : null;
  } catch (error) {
    console.error('[NotificationService] Error fetching user role:', error);
    return null;
  }
};

const listNotifications = async (userId, { 
  status = null, 
  type = null, 
  limit = 50, 
  offset = 0,
  unreadOnly = false 
} = {}) => {
  const userRoleId = await getUserRoleId(userId);
  
  const where = ['user_id = ?'];
  const params = [userId];
  
  if (userRoleId) {
    where.push('(user_id IS NULL AND role_id = ?)');
    params.push(userRoleId);
  }
  
  const baseWhere = where.length > 1 
    ? `(${where.join(' OR ')})`
    : where[0];
  
  const whereConditions = [baseWhere];
  const whereParams = [...params];
  
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
  
  const total = countResult && countResult.length > 0 
    ? (typeof countResult[0].total === 'number' 
        ? countResult[0].total 
        : parseInt(countResult[0].total, 10) || 0)
    : 0;
  
  return { notifications: notifications || [], total };
};

const getUnreadCount = async (userId) => {
  try {
    const userRoleId = await getUserRoleId(userId);
    
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
    
    if (!result || result.length === 0) {
      return 0;
    }
    
    const count = result[0]?.count;
    return typeof count === 'number' ? count : parseInt(count, 10) || 0;
  } catch (error) {
    console.error('[NotificationService] Error getting unread count:', error);
    return 0;
  }
};

const markAsRead = async (notificationId, userId) => {
  const userRoleId = await getUserRoleId(userId);
  
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

const markAllAsRead = async (userId) => {
  const userRoleId = await getUserRoleId(userId);
  
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

const dismissNotification = async (notificationId, userId) => {
  const userRoleId = await getUserRoleId(userId);
  
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

const getNotificationPreferences = async (userId) => {
  const prefs = await query(
    'SELECT notification_type, enabled, email_enabled FROM notification_preferences WHERE user_id = ?',
    [userId]
  );
  return prefs;
};

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


const notifyInvoiceCreated = async (invoice, createdBy) => {
  const message = `New invoice ${invoice.invoice_number} created for ₹${parseFloat(invoice.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
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

const notifyInvoiceApprovalPending = async (invoice) => {
  const message = `Invoice ${invoice.invoice_number} is pending approval`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
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

const notifyPaymentDue = async (invoice) => {
  const message = `Payment due for invoice ${invoice.invoice_number}: ₹${parseFloat(invoice.balance || invoice.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
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

const notifyPaymentOverdue = async (invoice) => {
  const daysOverdue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
  const message = `Payment overdue for invoice ${invoice.invoice_number} by ${daysOverdue} days: ₹${parseFloat(invoice.balance || invoice.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/invoices/view/${invoice.id}`;
  
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

const notifyPaymentReceived = async (payment, invoice) => {
  const message = `Payment received for invoice ${invoice.invoice_number}: ₹${parseFloat(payment.amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/payments/view/${payment.id}`;
  
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

const notifyPOCreated = async (po, createdBy) => {
  const message = `New PO ${po.po_number} created for ₹${parseFloat(po.total_amount || 0).toLocaleString('en-IN')}`;
  const linkUrl = `/po-entry/view/${po.id}`;
  
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

const notifyPOApprovalPending = async (po) => {
  const message = `PO ${po.po_number} is pending approval`;
  const linkUrl = `/po-entry/view/${po.id}`;
  
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

const notifyPOApproved = async (po, approvedBy) => {
  const message = `PO ${po.po_number} has been approved`;
  const linkUrl = `/po-entry/view/${po.id}`;
  
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

const notifyMasterDataChanged = async (entityType, entityId, entityName, changedBy) => {
  const message = `Master data updated: ${entityType} "${entityName}" has been modified`;
  const linkUrl = `/master-data/view/${entityId}`;
  
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

const notifyCollectionFollowup = async (invoice, followupMessage) => {
  const message = followupMessage || `Collection follow-up required for invoice ${invoice.invoice_number}`;
  const linkUrl = `/collections/view/${invoice.id}`;
  
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

const notifyAdminAnnouncement = async (message, linkUrl = null, metadata = null, createdBy = null) => {
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

