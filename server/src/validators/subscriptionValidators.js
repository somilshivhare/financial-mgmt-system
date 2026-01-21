const { z } = require('zod');

const subscriptionSchema = z.object({
  plan: z.string().min(2),
  status: z.enum(['trial', 'active', 'past_due', 'canceled']).optional(),
  seats: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

module.exports = { subscriptionSchema };

