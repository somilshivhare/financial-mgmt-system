const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { meetingSchema, minuteSchema } = require('../../validators/momValidators');
const { 
  listMeetings, 
  getMeetingById,
  createMeeting, 
  updateMeeting,
  deleteMeeting,
  addMinute, 
  listMinutes 
} = require('../../controllers/momController');

const router = express.Router();

// List all meetings
router.get('/', requireAuth, listMeetings);

// Get meeting by ID
router.get('/:id', requireAuth, getMeetingById);

// Create new meeting
router.post('/', requireAuth, validate(meetingSchema), createMeeting);

// Update meeting
router.put('/:id', requireAuth, validate(meetingSchema), updateMeeting);

// Delete meeting
router.delete('/:id', requireAuth, deleteMeeting);

// Get minutes for a meeting
router.get('/:id/minutes', requireAuth, listMinutes);

// Add minute to a meeting
router.post('/:id/minutes', requireAuth, validate(minuteSchema), addMinute);

module.exports = router;
