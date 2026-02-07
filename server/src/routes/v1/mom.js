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

router.get('/', requireAuth, listMeetings);

router.get('/:id', requireAuth, getMeetingById);

router.post('/', requireAuth, validate(meetingSchema), createMeeting);

router.put('/:id', requireAuth, validate(meetingSchema), updateMeeting);

router.delete('/:id', requireAuth, deleteMeeting);

router.get('/:id/minutes', requireAuth, listMinutes);

router.post('/:id/minutes', requireAuth, validate(minuteSchema), addMinute);

module.exports = router;
