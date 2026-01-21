const { z } = require('zod');

const meetingSchema = z.object({
  title: z.string().min(3),
  meetingDate: z.string(),
  notes: z.string().optional().or(z.literal('')),
});

const minuteSchema = z.object({
  item: z.string().min(3),
  ownerUserId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'done']).optional(),
});

module.exports = { meetingSchema, minuteSchema };

