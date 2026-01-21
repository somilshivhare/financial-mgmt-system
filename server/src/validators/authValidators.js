const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.number().int().positive(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

module.exports = { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema };