const { z } = require('zod');

const poLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1),
  productId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const poSchema = z.object({
  poNumber: z.string().min(3),
  customerId: z.string().uuid(),
  currency: z.string().min(3).max(8).default('USD'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  lines: z.array(poLineSchema).min(1),
});

module.exports = { poSchema };

