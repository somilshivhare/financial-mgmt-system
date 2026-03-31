/** Financial year as 8 digits: e.g. 20252026 (matches server invoice/PO logic). */
export function getFinancialYearConcat(dateLike = null) {
  const d = dateLike ? new Date(dateLike) : new Date()
  const dt = Number.isNaN(d.getTime()) ? new Date() : d
  const year = dt.getFullYear()
  const month = dt.getMonth() + 1
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = fyStart + 1
  return `${fyStart}${fyEnd}`
}

export function normalizeBusinessUnitToken(bu) {
  const cleaned = String(bu || 'MAIN')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  return cleaned || 'MAIN'
}

/** BU dropdown may be "Other" with free text in businessUnitOther */
export function resolveBusinessUnit(businessUnit, businessUnitOther) {
  if (businessUnit === 'Other' && businessUnitOther && String(businessUnitOther).trim()) {
    return normalizeBusinessUnitToken(businessUnitOther)
  }
  return normalizeBusinessUnitToken(businessUnit || 'MAIN')
}

/** Same pattern as server poService.generateNextPONumber: PO-{BU}-{FY8}- */
export function getPONumberPrefix(businessUnit, poDate, businessUnitOther) {
  const bu = resolveBusinessUnit(businessUnit, businessUnitOther)
  const fy = getFinancialYearConcat(poDate || null)
  return `PO-${bu}-${fy}-`
}

export function resolveInvoiceTypeToken(invoiceType, invoiceTypeOther) {
  if (invoiceType === 'Other' && invoiceTypeOther && String(invoiceTypeOther).trim()) {
    return String(invoiceTypeOther).trim().toUpperCase().slice(0, 8) || 'REG'
  }
  return (invoiceType || 'REG').toString().trim().toUpperCase().slice(0, 8) || 'REG'
}

/** Same pattern as server getNextInvoiceNumber: INV-{TYPE}-{BU}-{FY8}- */
export function getInvoiceNumberPrefix(invoiceType, businessUnit, businessUnitOther, invoiceTypeOther, dateLike = null) {
  const type = resolveInvoiceTypeToken(invoiceType, invoiceTypeOther)
  const bu = resolveBusinessUnit(businessUnit, businessUnitOther)
  const fy = getFinancialYearConcat(dateLike)
  return `INV-${type}-${bu}-${fy}-`
}
