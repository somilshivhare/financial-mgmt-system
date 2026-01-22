const { z } = require('zod');

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  meeting_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  meeting_type: z.enum(['Internal', 'Client', 'Vendor', 'Other']).optional(),
  agenda: z.string().optional().nullable(),
  discussion_points: z.string().optional().nullable(),
  decisions_taken: z.string().optional().nullable(),
  next_meeting_date: z.string().date().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  notes: z.string().optional().nullable(),
  participants: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['user', 'customer', 'vendor', 'employee']).optional(),
    role: z.string().optional().nullable(),
  })).optional(),
  actionItems: z.array(z.object({
    id: z.string().optional(),
    task: z.string(),
    ownerId: z.string().uuid().optional().nullable(),
    dueDate: z.string().date().optional().nullable(),
    status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled', 'pending', 'in_progress', 'completed', 'cancelled']).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'low', 'medium', 'high']).optional(),
  })).optional(),
});

const minuteSchema = z.object({
  item: z.string().min(1).optional(),
  task: z.string().min(1).optional(),
  ownerUserId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  dueDate: z.string().date().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'Pending', 'In Progress', 'Completed', 'Cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'Low', 'Medium', 'High']).optional(),
});

module.exports = { meetingSchema, minuteSchema };
