const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { uploadSupportAttachments } = require('../../middleware/upload');
const {
  createTicketSchema,
  addReplySchema,
  updateStatusSchema,
  assignTicketSchema,
  updatePrioritySchema,
  listTicketsQuerySchema,
} = require('../../validators/supportTicketValidators');
const {
  createTicket,
  listTickets,
  getTicket,
  addReply,
  updateStatus,
  assignTicket,
  updatePriority,
} = require('../../controllers/supportTicketController');

const router = express.Router();

router.use(requireAuth);

router.post('/', uploadSupportAttachments, createTicket);

router.get('/', validate(listTicketsQuerySchema, 'query'), listTickets);

router.get('/:ticketId', getTicket);

router.post('/:ticketId/replies', validate(addReplySchema), addReply);

router.patch('/:ticketId/status', validate(updateStatusSchema), updateStatus);

router.patch('/:ticketId/assign', requireRole('admin'), validate(assignTicketSchema), assignTicket);

router.patch('/:ticketId/priority', requireRole('admin'), validate(updatePrioritySchema), updatePriority);

module.exports = router;

