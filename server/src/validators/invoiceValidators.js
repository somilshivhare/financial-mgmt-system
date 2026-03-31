const { z } = require('zod');

const invoiceLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1),
  productId: z.string().uuid().optional().nullable(),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
});

const invoiceSchema = z
  .object({
    poId: z.string().uuid().optional(),
    key_id: z.string().min(1).optional(),
    keyID: z.string().min(1).optional(),
    customerId: z.string().uuid().optional().nullable(),
    invoiceNumber: z.string().min(1).optional(),
    internalInvoiceNo: z.string().min(1).optional(),
    issue_date: z.string().min(1).optional(),
    gstTaxInvoiceDate: z.string().min(1).optional(),
    dueDate: z.string().optional(),
    due_date: z.string().optional(),
    currency: z.string().min(1).max(8).optional(),
    lines: z.array(invoiceLineSchema).min(0).optional(),
  })
  .refine(
    (data) => data.poId || (data.key_id && data.key_id.trim()) || (data.keyID && data.keyID.trim()),
    { message: 'Either poId or key_id (PO number) is required', path: ['key_id'] }
  )
  .refine(
    (data) =>
      (data.invoiceNumber && data.invoiceNumber.length >= 1) ||
      (data.internalInvoiceNo && data.internalInvoiceNo.length >= 1),
    { message: 'Invoice number or internal invoice number is required', path: ['invoiceNumber'] }
  )
  .refine(
    (data) => (data.issue_date && data.issue_date.length >= 1) || (data.gstTaxInvoiceDate && data.gstTaxInvoiceDate.length >= 1),
    { message: 'Issue date or GST tax invoice date is required', path: ['issue_date'] }
  )
  .passthrough();

module.exports = { invoiceSchema };

