const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');
const alertsService = require('./alertsService');

/**
 * Generate unique ticket number (format: TCK-YYYY-NNNNN)
 */
const generateTicketNumber = async () => {
  const currentYear = new Date().getFullYear();
  
  return transaction(async (conn) => {
    // Get or create counter for current year
    const [counterRow] = await conn.execute(
      'SELECT counter FROM support_ticket_counter WHERE year = ? FOR UPDATE',
      [currentYear]
    );
    
    let counter = 0;
    if (counterRow.length === 0) {
      await conn.execute(
        'INSERT INTO support_ticket_counter (year, counter) VALUES (?, 0)',
        [currentYear]
      );
    } else {
      counter = counterRow[0].counter;
    }
    
    // Increment counter
    counter += 1;
    await conn.execute(
      'UPDATE support_ticket_counter SET counter = ?, updated_at = NOW() WHERE year = ?',
      [counter, currentYear]
    );
    
    // Format: TCK-YYYY-NNNNN (5 digits)
    const ticketNumber = `TCK-${currentYear}-${String(counter).padStart(5, '0')}`;
    return ticketNumber;
  });
};

/**
 * Create a new support ticket
 */
const createTicket = async (ticketData, userId) => {
  const ticketId = uuidv4();
  const ticketNumber = await generateTicketNumber();
  
  return transaction(async (conn) => {
    // Insert ticket
    await conn.execute(
      `INSERT INTO support_tickets 
       (id, ticket_number, user_id, category, priority, subject, description, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NOW())`,
      [
        ticketId,
        ticketNumber,
        userId,
        ticketData.category,
        ticketData.priority,
        ticketData.subject,
        ticketData.description,
      ]
    );
    
    // Log creation in history
    const historyId = uuidv4();
    await conn.execute(
      `INSERT INTO support_ticket_history 
       (id, ticket_id, changed_by, change_type, change_description, created_at)
       VALUES (?, ?, ?, 'created', ?, NOW())`,
      [
        historyId,
        ticketId,
        userId,
        `Ticket created: ${ticketData.category} - ${ticketData.subject}`,
      ]
    );
    
    // Create alert for admins about new ticket
    try {
      await alertsService.createAlert(
        {
          userId: null, // System-wide alert
          alertType: 'support_ticket_created',
          message: `New support ticket ${ticketNumber}: ${ticketData.subject}`,
          linkUrl: `/support/tickets/${ticketId}`,
        },
        userId
      );
    } catch (err) {
      console.error('Failed to create alert for new ticket:', err);
    }
    
    // Get created ticket
    const [tickets] = await conn.execute(
      `SELECT 
        t.*,
        u.full_name as user_name,
        u.email as user_email,
        a.full_name as assigned_to_name
       FROM support_tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users a ON t.assigned_to = a.id
       WHERE t.id = ?`,
      [ticketId]
    );
    
    return formatTicket(tickets[0]);
  });
};

/**
 * Add attachments to a ticket
 */
const addAttachments = async (ticketId, attachments, userId) => {
  return transaction(async (conn) => {
    const attachmentIds = [];
    
    for (const attachment of attachments) {
      const attachmentId = uuidv4();
      await conn.execute(
        `INSERT INTO support_ticket_attachments
         (id, ticket_id, storage_file_id, file_name, file_path, file_size_bytes, mime_type, uploaded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          attachmentId,
          ticketId,
          attachment.storageFileId || null,
          attachment.fileName,
          attachment.filePath,
          attachment.fileSizeBytes,
          attachment.mimeType || null,
          userId,
        ]
      );
      attachmentIds.push(attachmentId);
    }
    
    return attachmentIds;
  });
};

/**
 * Get ticket by ID
 */
const getTicketById = async (ticketId, userId, userRole) => {
  const tickets = await query(
    `SELECT 
      t.*,
      u.full_name as user_name,
      u.email as user_email,
      a.full_name as assigned_to_name,
      a.email as assigned_to_email
     FROM support_tickets t
     LEFT JOIN users u ON t.user_id = u.id
     LEFT JOIN users a ON t.assigned_to = a.id
     WHERE t.id = ?`,
    [ticketId]
  );
  
  if (tickets.length === 0) {
    throw new Error('TICKET_NOT_FOUND');
  }
  
  const ticket = tickets[0];
  
  // Check access: users can only see their own tickets, admins can see all
  if (userRole !== 'admin' && ticket.user_id !== userId) {
    throw new Error('FORBIDDEN');
  }
  
  return formatTicket(ticket);
};

/**
 * List tickets for a user (or all tickets for admin)
 */
const listTickets = async (userId, userRole, filters = {}) => {
  let sql = `
    SELECT 
      t.*,
      u.full_name as user_name,
      u.email as user_email,
      a.full_name as assigned_to_name
    FROM support_tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.assigned_to = a.id
    WHERE 1=1
  `;
  const params = [];
  
  // Filter by user if not admin
  if (userRole !== 'admin') {
    sql += ' AND t.user_id = ?';
    params.push(userId);
  }
  
  // Apply filters
  if (filters.status) {
    sql += ' AND t.status = ?';
    params.push(filters.status);
  }
  
  if (filters.priority) {
    sql += ' AND t.priority = ?';
    params.push(filters.priority);
  }
  
  if (filters.category) {
    sql += ' AND t.category = ?';
    params.push(filters.category);
  }
  
  if (filters.assignedTo) {
    sql += ' AND t.assigned_to = ?';
    params.push(filters.assignedTo);
  }
  
  // Order by created_at desc
  sql += ' ORDER BY t.created_at DESC';
  
  // Limit
  const limit = filters.limit || 50;
  sql += ' LIMIT ?';
  params.push(limit);
  
  if (filters.offset) {
    sql += ' OFFSET ?';
    params.push(filters.offset);
  }
  
  const tickets = await query(sql, params);
  return tickets.map(formatTicket);
};

/**
 * Get ticket history (replies and status changes)
 */
const getTicketHistory = async (ticketId, userId, userRole) => {
  // First verify access
  const ticket = await getTicketById(ticketId, userId, userRole);
  
  // Get replies
  const replies = await query(
    `SELECT 
      r.*,
      u.full_name as user_name,
      u.email as user_email
     FROM support_ticket_replies r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.ticket_id = ?
     ORDER BY r.created_at ASC`,
    [ticketId]
  );
  
  // Get history (status changes, etc.)
  const history = await query(
    `SELECT 
      h.*,
      u.full_name as changed_by_name
     FROM support_ticket_history h
     LEFT JOIN users u ON h.changed_by = u.id
     WHERE h.ticket_id = ?
     ORDER BY h.created_at ASC`,
    [ticketId]
  );
  
  // Get attachments
  const attachments = await query(
    `SELECT 
      a.*,
      u.full_name as uploaded_by_name
     FROM support_ticket_attachments a
     LEFT JOIN users u ON a.uploaded_by = u.id
     WHERE a.ticket_id = ?
     ORDER BY a.created_at ASC`,
    [ticketId]
  );
  
  return {
    ticket,
    replies: replies.map(formatReply),
    history: history.map(formatHistory),
    attachments: attachments.map(formatAttachment),
  };
};

/**
 * Add a reply to a ticket
 */
const addReply = async (ticketId, message, userId, userRole, isInternal = false) => {
  return transaction(async (conn) => {
    // Verify ticket exists and user has access
    const ticket = await getTicketById(ticketId, userId, userRole);
    
    // Only admins can add internal replies
    if (isInternal && userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }
    
    const replyId = uuidv4();
    await conn.execute(
      `INSERT INTO support_ticket_replies
       (id, ticket_id, user_id, message, is_internal, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [replyId, ticketId, userId, message, isInternal]
    );
    
    // Log in history
    const historyId = uuidv4();
    await conn.execute(
      `INSERT INTO support_ticket_history
       (id, ticket_id, changed_by, change_type, change_description, created_at)
       VALUES (?, ?, ?, 'replied', ?, NOW())`,
      [
        historyId,
        ticketId,
        userId,
        isInternal ? 'Internal reply added' : 'Reply added',
      ]
    );
    
    // If ticket is closed/resolved and user replies, reopen it
    if ((ticket.status === 'closed' || ticket.status === 'resolved') && !isInternal) {
      await updateTicketStatus(ticketId, 'open', userId, userRole, 'Reopened by user reply');
    }
    
    // Create alert for ticket owner (if not the replier) or admins
    try {
      if (isInternal) {
        // Alert ticket owner about admin reply
        await alertsService.createAlert(
          {
            userId: ticket.user_id,
            alertType: 'support_ticket_reply',
            message: `Admin replied to ticket ${ticket.ticket_number}`,
            linkUrl: `/support/tickets/${ticketId}`,
          },
          userId
        );
      } else {
        // Alert admins about user reply
        await alertsService.createAlert(
          {
            userId: null,
            alertType: 'support_ticket_reply',
            message: `User replied to ticket ${ticket.ticket_number}`,
            linkUrl: `/support/tickets/${ticketId}`,
          },
          userId
        );
      }
    } catch (err) {
      console.error('Failed to create alert for reply:', err);
    }
    
    const replies = await query(
      `SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email
       FROM support_ticket_replies r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [replyId]
    );
    
    return formatReply(replies[0]);
  });
};

/**
 * Update ticket status
 */
const updateTicketStatus = async (ticketId, status, userId, userRole, notes = null) => {
  return transaction(async (conn) => {
    // Get current ticket
    const [tickets] = await conn.execute(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (tickets.length === 0) {
      throw new Error('TICKET_NOT_FOUND');
    }
    
    const ticket = tickets[0];
    
    // Check access: users can only update their own tickets to certain statuses
    if (userRole !== 'admin' && ticket.user_id !== userId) {
      throw new Error('FORBIDDEN');
    }
    
    // Users can only close their own tickets, admins can set any status
    if (userRole !== 'admin' && status !== 'closed' && ticket.user_id !== userId) {
      throw new Error('FORBIDDEN');
    }
    
    const oldStatus = ticket.status;
    const changeType = oldStatus === 'open' && status !== 'open' ? 'status_changed' : 
                      status === 'resolved' ? 'resolved' :
                      status === 'closed' ? 'closed' :
                      status === 'open' && oldStatus !== 'open' ? 'reopened' : 'status_changed';
    
    // Update ticket
    const updateFields = ['status = ?', 'updated_at = NOW()'];
    const updateParams = [status];
    
    if (status === 'resolved') {
      updateFields.push('resolved_at = NOW()', 'resolved_by = ?');
      updateParams.push(userId);
    }
    
    if (status === 'closed') {
      updateFields.push('closed_at = NOW()', 'closed_by = ?');
      updateParams.push(userId);
    }
    
    if (notes) {
      updateFields.push('resolution_notes = ?');
      updateParams.push(notes);
    }
    
    updateParams.push(ticketId);
    
    await conn.execute(
      `UPDATE support_tickets SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    // Log in history
    const historyId = uuidv4();
    await conn.execute(
      `INSERT INTO support_ticket_history
       (id, ticket_id, changed_by, change_type, old_value, new_value, change_description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        historyId,
        ticketId,
        userId,
        changeType,
        oldStatus,
        status,
        notes || `Status changed from ${oldStatus} to ${status}`,
      ]
    );
    
    // Create alert for status change
    try {
      await alertsService.createAlert(
        {
          userId: ticket.user_id,
          alertType: 'support_ticket_status_changed',
          message: `Ticket ${ticket.ticket_number} status changed to ${status}`,
          linkUrl: `/support/tickets/${ticketId}`,
        },
        userId
      );
    } catch (err) {
      console.error('Failed to create alert for status change:', err);
    }
    
    // Get updated ticket
    return getTicketById(ticketId, userId, userRole);
  });
};

/**
 * Assign ticket to admin
 */
const assignTicket = async (ticketId, assignedTo, userId, userRole) => {
  if (userRole !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  
  return transaction(async (conn) => {
    const [tickets] = await conn.execute(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (tickets.length === 0) {
      throw new Error('TICKET_NOT_FOUND');
    }
    
    const ticket = tickets[0];
    const oldAssignedTo = ticket.assigned_to;
    
    await conn.execute(
      'UPDATE support_tickets SET assigned_to = ?, updated_at = NOW() WHERE id = ?',
      [assignedTo, ticketId]
    );
    
    // Log in history
    const historyId = uuidv4();
    await conn.execute(
      `INSERT INTO support_ticket_history
       (id, ticket_id, changed_by, change_type, old_value, new_value, change_description, created_at)
       VALUES (?, ?, ?, 'assigned', ?, ?, ?, NOW())`,
      [
        historyId,
        ticketId,
        userId,
        oldAssignedTo || 'Unassigned',
        assignedTo || 'Unassigned',
        assignedTo ? `Ticket assigned to user` : 'Ticket unassigned',
      ]
    );
    
    return getTicketById(ticketId, userId, userRole);
  });
};

/**
 * Update ticket priority
 */
const updatePriority = async (ticketId, priority, userId, userRole) => {
  if (userRole !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  
  return transaction(async (conn) => {
    const [tickets] = await conn.execute(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (tickets.length === 0) {
      throw new Error('TICKET_NOT_FOUND');
    }
    
    const ticket = tickets[0];
    const oldPriority = ticket.priority;
    
    await conn.execute(
      'UPDATE support_tickets SET priority = ?, updated_at = NOW() WHERE id = ?',
      [priority, ticketId]
    );
    
    // Log in history
    const historyId = uuidv4();
    await conn.execute(
      `INSERT INTO support_ticket_history
       (id, ticket_id, changed_by, change_type, old_value, new_value, change_description, created_at)
       VALUES (?, ?, ?, 'priority_changed', ?, ?, ?, NOW())`,
      [
        historyId,
        ticketId,
        userId,
        oldPriority,
        priority,
        `Priority changed from ${oldPriority} to ${priority}`,
      ]
    );
    
    return getTicketById(ticketId, userId, userRole);
  });
};

/**
 * Format ticket for API response
 */
const formatTicket = (ticket) => {
  if (!ticket) return null;
  
  return {
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    userId: ticket.user_id,
    userName: ticket.user_name,
    userEmail: ticket.user_email,
    category: ticket.category,
    priority: ticket.priority,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    assignedTo: ticket.assigned_to,
    assignedToName: ticket.assigned_to_name,
    assignedToEmail: ticket.assigned_to_email,
    resolutionNotes: ticket.resolution_notes,
    resolvedAt: ticket.resolved_at,
    resolvedBy: ticket.resolved_by,
    closedAt: ticket.closed_at,
    closedBy: ticket.closed_by,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
};

/**
 * Format reply for API response
 */
const formatReply = (reply) => {
  if (!reply) return null;
  
  return {
    id: reply.id,
    ticketId: reply.ticket_id,
    userId: reply.user_id,
    userName: reply.user_name,
    userEmail: reply.user_email,
    message: reply.message,
    isInternal: reply.is_internal,
    createdAt: reply.created_at,
    updatedAt: reply.updated_at,
  };
};

/**
 * Format history entry for API response
 */
const formatHistory = (history) => {
  if (!history) return null;
  
  return {
    id: history.id,
    ticketId: history.ticket_id,
    changedBy: history.changed_by,
    changedByName: history.changed_by_name,
    changeType: history.change_type,
    oldValue: history.old_value,
    newValue: history.new_value,
    changeDescription: history.change_description,
    createdAt: history.created_at,
  };
};

/**
 * Format attachment for API response
 */
const formatAttachment = (attachment) => {
  if (!attachment) return null;
  
  return {
    id: attachment.id,
    ticketId: attachment.ticket_id,
    storageFileId: attachment.storage_file_id,
    fileName: attachment.file_name,
    filePath: attachment.file_path,
    fileSizeBytes: attachment.file_size_bytes,
    mimeType: attachment.mime_type,
    uploadedBy: attachment.uploaded_by,
    uploadedByName: attachment.uploaded_by_name,
    createdAt: attachment.created_at,
  };
};

module.exports = {
  createTicket,
  addAttachments,
  getTicketById,
  listTickets,
  getTicketHistory,
  addReply,
  updateTicketStatus,
  assignTicket,
  updatePriority,
};

