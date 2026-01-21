const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const listMeetings = async ({ page = 1, pageSize = 20 }) => {
  const offset = (page - 1) * pageSize;
  const data = await query('SELECT * FROM meetings ORDER BY meeting_date DESC LIMIT ? OFFSET ?', [
    Number(pageSize),
    Number(offset),
  ]);
  const [{ total }] = await query('SELECT COUNT(*) as total FROM meetings');
  return { data, page: Number(page), pageSize: Number(pageSize), total };
};

const createMeeting = async (payload, userId) => {
  const id = uuidv4();
  await query(
    'INSERT INTO meetings (id, title, meeting_date, owner_user_id, notes) VALUES (?, ?, ?, ?, ?)',
    [id, payload.title, payload.meetingDate, userId, payload.notes || null],
  );
  const [meeting] = await query('SELECT * FROM meetings WHERE id = ?', [id]);
  return meeting;
};

const listMinutes = async (meetingId) => {
  return query('SELECT * FROM meeting_minutes WHERE meeting_id = ? ORDER BY created_at DESC', [meetingId]);
};

const addMinute = async (meetingId, payload, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO meeting_minutes (id, meeting_id, item, owner_user_id, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, meetingId, payload.item, payload.ownerUserId || null, payload.dueDate || null, payload.status || 'open'],
  );
  const [minute] = await query('SELECT * FROM meeting_minutes WHERE id = ?', [id]);
  return minute;
};

module.exports = { listMeetings, createMeeting, listMinutes, addMinute };

