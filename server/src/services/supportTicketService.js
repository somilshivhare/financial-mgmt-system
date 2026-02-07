const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const generateTicketNumber = async () => {
  const currentYear = new Date().getFullYear();
  
  return transaction(async (conn) => {
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
    
    counter += 1;
    await conn.execute(
      'UPDATE support_ticket_counter SET counter = ?, updated_at = NOW() WHERE year = ?',
      [counter, currentYear]
    );
    
    const ticketNumber = `TCK-${currentYear}-${String(counter).padStart(5, '0')}`;
    return ticketNumber;
  });
};

const createTicket = async (ticketData, userId) => {
  const ticketId = uuidv4();
  const ticketNumber = await generateTicketNumber();
  
  return transaction(async (conn) => {
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
  
  if (userRole !== 'admin' && ticket.user_id !== userId) {
    throw new Error('FORBIDDEN');
  }
  
  return formatTicket(ticket);
};

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
  
  if (userRole !== 'admin') {
    sql += ' AND t.user_id = ?';
    params.push(userId);
  }
  
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
  
  sql += ' ORDER BY t.created_at DESC';
  
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

const getTicketHistory = async (ticketId, userId, userRole) => {
  const ticket = await getTicketById(ticketId, userId, userRole);
  
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

const addReply = async (ticketId, message, userId, userRole, isInternal = false) => {
  return transaction(async (conn) => {
    const ticket = await getTicketById(ticketId, userId, userRole);
    
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
    
    if ((ticket.status === 'closed' || ticket.status === 'resolved') && !isInternal) {
      await updateTicketStatus(ticketId, 'open', userId, userRole, 'Reopened by user reply');
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

const updateTicketStatus = async (ticketId, status, userId, userRole, notes = null) => {
  return transaction(async (conn) => {
    const [tickets] = await conn.execute(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (tickets.length === 0) {
      throw new Error('TICKET_NOT_FOUND');
    }
    
    const ticket = tickets[0];
    
    if (userRole !== 'admin' && ticket.user_id !== userId) {
      throw new Error('FORBIDDEN');
    }
    
    if (userRole !== 'admin' && status !== 'closed' && ticket.user_id !== userId) {
      throw new Error('FORBIDDEN');
    }
    
    const oldStatus = ticket.status;
    const changeType = oldStatus === 'open' && status !== 'open' ? 'status_changed' : 
                      status === 'resolved' ? 'resolved' :
                      status === 'closed' ? 'closed' :
                      status === 'open' && oldStatus !== 'open' ? 'reopened' : 'status_changed';
    
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
    
    
    return getTicketById(ticketId, userId, userRole);
  });
};

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

