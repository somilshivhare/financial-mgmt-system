const { z } = require('zod');

const ticketCategorySchema = z.enum(['Billing', 'Invoice', 'Payment', 'PO', 'Access', 'Bug', 'Other'], {
  errorMap: () => ({ message: 'Invalid category' }),
});

const ticketPrioritySchema = z.enum(['Low', 'Medium', 'High', 'Critical'], {
  errorMap: () => ({ message: 'Invalid priority' }),
});

const ticketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed'], {
  errorMap: () => ({ message: 'Invalid status' }),
});

const createTicketSchema = z.object({
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject must be 255 characters or less'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be 5000 characters or less'),
  attachments: z.array(z.object({
    storageFileId: z.string().uuid().optional(),
    fileName: z.string().min(1),
    filePath: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
    mimeType: z.string().optional(),
  })).optional().default([]),
}).passthrough(); // Allow additional fields from multer

const addReplySchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message must be 2000 characters or less'),
  isInternal: z.boolean().optional().default(false),
});

const updateStatusSchema = z.object({
  status: ticketStatusSchema,
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

const assignTicketSchema = z.object({
  assignedTo: z.string().uuid().nullable(),
});

const updatePrioritySchema = z.object({
  priority: ticketPrioritySchema,
});

const listTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  category: ticketCategorySchema.optional(),
  assignedTo: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

module.exports = {
  createTicketSchema,
  addReplySchema,
  updateStatusSchema,
  assignTicketSchema,
  updatePrioritySchema,
  listTicketsQuerySchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  ticketStatusSchema,
};

