const { apiSuccess, apiError } = require('../utils/apiResponse');
const supportTicketService = require('../services/supportTicketService');
const {
  createTicketSchema,
  addReplySchema,
  updateStatusSchema,
  assignTicketSchema,
  updatePrioritySchema,
  listTicketsQuerySchema,
} = require('../validators/supportTicketValidators');

const createTicket = async (req, res, next) => {
  try {
    const attachments = [];
    if (req.files && req.files.length > 0) {
      attachments.push(...req.files.map(file => ({
        fileName: file.originalname,
        filePath: file.path,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
      })));
    }
    
    const ticketData = {
      category: req.body.category,
      priority: req.body.priority,
      subject: req.body.subject,
      description: req.body.description,
      attachments: attachments,
    };
    
    const validated = createTicketSchema.parse(ticketData);
    const userId = req.user.id;
    
    const ticket = await supportTicketService.createTicket(validated, userId);
    
    if (attachments.length > 0) {
      await supportTicketService.addAttachments(ticket.id, attachments, userId);
    }
    
    res.status(201).json(apiSuccess(ticket, 'Support ticket created successfully'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(apiError('File size too large. Maximum 10MB per file.', 'FILE_TOO_LARGE'));
    }
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json(apiError(err.message, 'INVALID_FILE_TYPE'));
    }
    next(err);
  }
};

const listTickets = async (req, res, next) => {
  try {
    const validated = listTicketsQuerySchema.parse(req.query);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const tickets = await supportTicketService.listTickets(userId, userRole, validated);
    res.json(apiSuccess(tickets));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    next(err);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const history = await supportTicketService.getTicketHistory(ticketId, userId, userRole);
    res.json(apiSuccess(history));
  } catch (err) {
    if (err.message === 'TICKET_NOT_FOUND') {
      return res.status(404).json(apiError('Ticket not found', 'TICKET_NOT_FOUND'));
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json(apiError('Access forbidden', 'FORBIDDEN'));
    }
    next(err);
  }
};

const addReply = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const validated = addReplySchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const reply = await supportTicketService.addReply(
      ticketId,
      validated.message,
      userId,
      userRole,
      validated.isInternal
    );
    
    res.status(201).json(apiSuccess(reply, 'Reply added successfully'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    if (err.message === 'TICKET_NOT_FOUND') {
      return res.status(404).json(apiError('Ticket not found', 'TICKET_NOT_FOUND'));
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json(apiError('Access forbidden', 'FORBIDDEN'));
    }
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const validated = updateStatusSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const ticket = await supportTicketService.updateTicketStatus(
      ticketId,
      validated.status,
      userId,
      userRole,
      validated.notes
    );
    
    res.json(apiSuccess(ticket, 'Ticket status updated successfully'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    if (err.message === 'TICKET_NOT_FOUND') {
      return res.status(404).json(apiError('Ticket not found', 'TICKET_NOT_FOUND'));
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json(apiError('Access forbidden', 'FORBIDDEN'));
    }
    next(err);
  }
};

const assignTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const validated = assignTicketSchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const ticket = await supportTicketService.assignTicket(
      ticketId,
      validated.assignedTo,
      userId,
      userRole
    );
    
    res.json(apiSuccess(ticket, 'Ticket assigned successfully'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    if (err.message === 'TICKET_NOT_FOUND') {
      return res.status(404).json(apiError('Ticket not found', 'TICKET_NOT_FOUND'));
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json(apiError('Access forbidden', 'FORBIDDEN'));
    }
    next(err);
  }
};

const updatePriority = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const validated = updatePrioritySchema.parse(req.body);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const ticket = await supportTicketService.updatePriority(
      ticketId,
      validated.priority,
      userId,
      userRole
    );
    
    res.json(apiSuccess(ticket, 'Ticket priority updated successfully'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    if (err.message === 'TICKET_NOT_FOUND') {
      return res.status(404).json(apiError('Ticket not found', 'TICKET_NOT_FOUND'));
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json(apiError('Access forbidden', 'FORBIDDEN'));
    }
    next(err);
  }
};

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  addReply,
  updateStatus,
  assignTicket,
  updatePriority,
};

