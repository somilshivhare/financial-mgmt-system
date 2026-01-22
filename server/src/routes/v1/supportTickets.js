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

// All routes require authentication
router.use(requireAuth);

// Create ticket (any authenticated user) - handle file uploads
router.post('/', uploadSupportAttachments, createTicket);

// List tickets (user's tickets or all for admin)
router.get('/', validate(listTicketsQuerySchema, 'query'), listTickets);

// Get ticket by ID with full history
router.get('/:ticketId', getTicket);

// Add reply to ticket
router.post('/:ticketId/replies', validate(addReplySchema), addReply);

// Update ticket status
router.patch('/:ticketId/status', validate(updateStatusSchema), updateStatus);

// Assign ticket (admin only)
router.patch('/:ticketId/assign', requireRole('admin'), validate(assignTicketSchema), assignTicket);

// Update priority (admin only)
router.patch('/:ticketId/priority', requireRole('admin'), validate(updatePrioritySchema), updatePriority);

module.exports = router;

