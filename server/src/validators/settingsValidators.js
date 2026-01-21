const { z } = require('zod');

const settingSchema = z.object({
  settingKey: z.string().min(2),
  settingValue: z.any(),
});

module.exports = { settingSchema };

