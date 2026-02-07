const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const listMeetings = async ({ page = 1, pageSize = 20, status, meetingType, dateFrom, dateTo }) => {
  const offset = (page - 1) * pageSize;
  const where = [];
  const params = [];
  
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  
  if (meetingType) {
    where.push('meeting_type = ?');
    params.push(meetingType);
  }
  
  if (dateFrom) {
    where.push('DATE(meeting_date) >= ?');
    params.push(dateFrom);
  }
  
  if (dateTo) {
    where.push('DATE(meeting_date) <= ?');
    params.push(dateTo);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  
  const data = await query(
    `SELECT * FROM meetings ${whereSql} ORDER BY meeting_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), Number(offset)],
  );
  const [{ total }] = await query(`SELECT COUNT(*) as total FROM meetings ${whereSql}`, params);
  return { data, page: Number(page), pageSize: Number(pageSize), total };
};

const getMeetingById = async (id) => {
  const [meeting] = await query('SELECT * FROM meetings WHERE id = ?', [id]);
  if (!meeting) return null;
  
  const participants = await query(
    'SELECT * FROM meeting_participants WHERE meeting_id = ?',
    [id]
  );
  
  const actionItems = await query(
    'SELECT * FROM meeting_minutes WHERE meeting_id = ? ORDER BY created_at ASC',
    [id]
  );
  
  return {
    ...meeting,
    participants: participants.map(p => ({ id: p.participant_id, type: p.participant_type })),
    actionItems: actionItems.map(item => ({
      id: item.id,
      task: item.task || item.item,
      ownerId: item.owner_user_id,
      dueDate: item.due_date,
      status: item.status,
      priority: item.priority || 'medium',
    })),
  };
};

const createMeeting = async (payload, userId) => {
  return await transaction(async (trx) => {
    const id = uuidv4();
    
    await trx.query(
      `INSERT INTO meetings (
        id, title, meeting_date, meeting_type, owner_user_id, 
        agenda, discussion_points, decisions_taken, next_meeting_date, 
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        payload.title,
        payload.meeting_date,
        payload.meeting_type || 'Internal',
        userId,
        payload.agenda || null,
        payload.discussion_points || null,
        payload.decisions_taken || null,
        payload.next_meeting_date || null,
        payload.status || 'draft',
        payload.notes || null,
      ],
    );
    
    if (payload.participants && payload.participants.length > 0) {
      for (const participant of payload.participants) {
        await trx.query(
          `INSERT INTO meeting_participants (id, meeting_id, participant_id, participant_type, role)
           VALUES (?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            id,
            participant.id,
            participant.type || 'user',
            participant.role || null,
          ],
        );
      }
    }
    
    if (payload.actionItems && payload.actionItems.length > 0) {
      for (const item of payload.actionItems) {
        if (item.task && item.task.trim()) {
          await trx.query(
            `INSERT INTO meeting_minutes (
              id, meeting_id, item, task, owner_user_id, due_date, status, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              id,
              item.task,
              item.task,
              item.ownerId || null,
              item.dueDate || null,
              item.status || 'pending',
              (item.priority || 'medium').toLowerCase(),
            ],
          );
        }
      }
    }
    
    return await getMeetingById(id);
  });
};

const updateMeeting = async (id, payload, userId) => {
  return await transaction(async (trx) => {
    await trx.query(
      `UPDATE meetings SET
        title = ?,
        meeting_date = ?,
        meeting_type = ?,
        agenda = ?,
        discussion_points = ?,
        decisions_taken = ?,
        next_meeting_date = ?,
        status = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        payload.title,
        payload.meeting_date,
        payload.meeting_type,
        payload.agenda || null,
        payload.discussion_points || null,
        payload.decisions_taken || null,
        payload.next_meeting_date || null,
        payload.status || 'draft',
        payload.notes || null,
        id,
      ],
    );
    
    await trx.query('DELETE FROM meeting_participants WHERE meeting_id = ?', [id]);
    await trx.query('DELETE FROM meeting_minutes WHERE meeting_id = ?', [id]);
    
    if (payload.participants && payload.participants.length > 0) {
      for (const participant of payload.participants) {
        await trx.query(
          `INSERT INTO meeting_participants (id, meeting_id, participant_id, participant_type, role)
           VALUES (?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            id,
            participant.id,
            participant.type || 'user',
            participant.role || null,
          ],
        );
      }
    }
    
    if (payload.actionItems && payload.actionItems.length > 0) {
      for (const item of payload.actionItems) {
        if (item.task && item.task.trim()) {
          await trx.query(
            `INSERT INTO meeting_minutes (
              id, meeting_id, item, task, owner_user_id, due_date, status, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id || uuidv4(),
              id,
              item.task,
              item.task,
              item.ownerId || null,
              item.dueDate || null,
              item.status || 'pending',
              (item.priority || 'medium').toLowerCase(),
            ],
          );
        }
      }
    }
    
    return await getMeetingById(id);
  });
};

const deleteMeeting = async (id) => {
  await query('DELETE FROM meetings WHERE id = ?', [id]);
  return { success: true };
};

const listMinutes = async (meetingId) => {
  return query('SELECT * FROM meeting_minutes WHERE meeting_id = ? ORDER BY created_at DESC', [meetingId]);
};

const addMinute = async (meetingId, payload, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO meeting_minutes (id, meeting_id, item, task, owner_user_id, due_date, status, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      meetingId,
      payload.item || payload.task,
      payload.task || payload.item,
      payload.ownerUserId || null,
      payload.dueDate || null,
      payload.status || 'pending',
      (payload.priority || 'medium').toLowerCase(),
    ],
  );
  const [minute] = await query('SELECT * FROM meeting_minutes WHERE id = ?', [id]);
  return minute;
};

module.exports = { 
  listMeetings, 
  getMeetingById,
  createMeeting, 
  updateMeeting,
  deleteMeeting,
  listMinutes, 
  addMinute 
};
