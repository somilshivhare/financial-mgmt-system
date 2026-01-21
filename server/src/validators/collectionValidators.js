const { z } = require('zod');

const collectionPlanSchema = z.object({
  invoiceId: z.string().uuid(),
  targetDate: z.string(),
  expectedAmount: z.number().positive(),
  status: z.enum(['planned', 'in_progress', 'done', 'canceled']).optional(),
  notes: z.string().optional().or(z.literal('')),
});

const collectionActionSchema = z.object({
  actionDate: z.string(),
  actionType: z.string().min(2),
  outcome: z.string().optional().or(z.literal('')),
  nextStep: z.string().optional().or(z.literal('')),
});

module.exports = { collectionPlanSchema, collectionActionSchema };

