const { z } = require('zod');

const alertSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  alertType: z.string().min(2),
  message: z.string().min(3),
  linkUrl: z.string().url().optional().nullable(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  invoiceId: z.string().uuid().optional().nullable(),
  paymentId: z.string().uuid().optional().nullable(),
  poId: z.string().uuid().optional().nullable(),
  collectionPlanId: z.string().uuid().optional().nullable(),
});

const alertStatusSchema = z.object({
  status: z.enum(['new', 'read', 'dismissed']),
});

module.exports = { alertSchema, alertStatusSchema };
