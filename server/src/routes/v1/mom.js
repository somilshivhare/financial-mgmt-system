const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { meetingSchema, minuteSchema } = require('../../validators/momValidators');
const { listMeetings, createMeeting, addMinute, listMinutes } = require('../../controllers/momController');

const router = express.Router();

router.get('/', requireAuth, listMeetings);
router.post('/', requireAuth, requireRole('admin', 'operations', 'sales'), validate(meetingSchema), createMeeting);
router.get('/:id/minutes', requireAuth, listMinutes);
router.post('/:id/minutes', requireAuth, requireRole('admin', 'operations', 'sales'), validate(minuteSchema), addMinute);

module.exports = router;

