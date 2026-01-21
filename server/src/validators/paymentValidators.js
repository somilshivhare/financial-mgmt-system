const { z } = require('zod');

const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.string().min(2),
  reference: z.string().optional().or(z.literal('')),
  paidAt: z.string(),
  status: z.enum(['pending', 'cleared', 'failed']).optional(),
});

module.exports = { paymentSchema };

