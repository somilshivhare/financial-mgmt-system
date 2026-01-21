const { z } = require('zod');

const customerSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(40).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().max(80).optional().or(z.literal('')),
  unit: z.string().max(20).optional().or(z.literal('')),
  unitPrice: z.number().nonnegative(),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = { customerSchema, productSchema };

