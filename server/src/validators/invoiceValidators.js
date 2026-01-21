const { z } = require('zod');

const invoiceLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1),
  productId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  poId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(3),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.string().min(3).max(8).default('USD'),
  lines: z.array(invoiceLineSchema).min(1),
});

module.exports = { invoiceSchema };

