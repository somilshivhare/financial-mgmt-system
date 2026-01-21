const { z } = require('zod');

const alertSchema = z.object({
  userId: z.string().uuid().optional(),
  alertType: z.string().min(2),
  message: z.string().min(3),
  linkUrl: z.string().url().optional(),
});

const alertStatusSchema = z.object({
  status: z.enum(['new', 'read', 'dismissed']),
});

module.exports = { alertSchema, alertStatusSchema };

