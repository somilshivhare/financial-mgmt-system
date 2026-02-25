const { z } = require('zod');

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  companyEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  companyPhone: z.string().max(20).optional().or(z.literal('')),
  companyAddress: z.string().max(1000).optional().or(z.literal('')),
  financialYear: z.string().regex(/^\d{4}-\d{4}$/, 'Financial year must be in format YYYY-YYYY'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'JPY'], {
    errorMap: () => ({ message: 'Invalid currency code' }),
  }),
});

const invoiceSettingsSchema = z.object({
  numberingFormat: z.string().min(1, 'Numbering format is required').max(100),
  taxDefaultPercent: z.number().min(0, 'Tax must be 0 or greater').max(100, 'Tax cannot exceed 100%'),
  paymentTermDefault: z.string().min(1, 'Payment term is required').max(50),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  systemAlerts: z.boolean(),
});

const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeoutMinutes: z.number().min(5, 'Session timeout must be at least 5 minutes').max(240, 'Session timeout cannot exceed 240 minutes'),
});

const rolePermissionSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
});

const accessSettingsSchema = z.object({
  roles: z.array(rolePermissionSchema),
});

const settingsUpdateSchema = z.object({
  general: generalSettingsSchema.optional(),
  invoice: invoiceSettingsSchema.optional(),
  notifications: notificationSettingsSchema.optional(),
  security: securitySettingsSchema.optional(),
  access: accessSettingsSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one setting category must be provided' }
);

const settingSchema = z.object({
  settingKey: z.string().min(1),
  settingValue: z.any(),
});

const resetSettingsSchema = z.object({
  keys: z.array(z.string()).optional(),
});

module.exports = {
  generalSettingsSchema,
  invoiceSettingsSchema,
  notificationSettingsSchema,
  securitySettingsSchema,
  accessSettingsSchema,
  settingsUpdateSchema,
  settingSchema,
  resetSettingsSchema,
};
