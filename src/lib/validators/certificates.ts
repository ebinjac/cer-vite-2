const AMEX_FIELDS = [
  'commonName',
  'serialNumber',
  'centralID',
  'applicationName',
  'comment',
  'serverName',
  'keystorePath',
  'uri',
] as const

const NON_AMEX_FIELDS = [
  'commonName',
  'serialNumber',
  'centralID',
  'applicationName',
  'validTo',
  'environment',
  'comment',
  'serverName',
  'keystorePath',
  'uri',
] as const

export const CERT_ENV_OPTIONS = ['E1', 'E2', 'E3'] as const

export type CertContext = { isAmex: boolean }

export function detectTemplate(headers: string[]): CertContext | null {
  const isAmex = headers.length === AMEX_FIELDS.length && AMEX_FIELDS.every((f, i) => headers[i] === f)
  const isNon = headers.length === NON_AMEX_FIELDS.length && NON_AMEX_FIELDS.every((f, i) => headers[i] === f)
  if (!isAmex && !isNon) return null
  return { isAmex }
}

export function validateCertificateRow(
  row: Record<string, string>,
  ctx: CertContext,
  applications: string[]
) {
  const errors: string[] = []

  for (const field of ['commonName', 'serialNumber', 'centralID']) {
    if (!row[field]) errors.push(`${field} is required`)
  }

  if (!row.applicationName) {
    errors.push('applicationName is required')
  } else if (applications.length > 0 && !applications.includes(row.applicationName)) {
    errors.push(`applicationName must be one of: ${applications.join(', ')}`)
  }

  if (ctx.isAmex) {
    if (row.validTo) errors.push('validTo must be empty for Amex cert')
    if (row.environment) errors.push('environment must be empty for Amex cert')
  } else {
    if (!row.validTo) {
      errors.push('validTo is required for Non Amex cert')
    } else {
      const dateFormatRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/
      if (!dateFormatRegex.test(row.validTo)) {
        errors.push('validTo must be in YYYY-MM-DD format (e.g., 2025-05-19)')
      } else {
        const d = new Date(row.validTo)
        if (isNaN(d.getTime())) errors.push('validTo must be a valid date')
      }
    }
    if (!row.environment) {
      errors.push('environment is required for Non Amex cert')
    } else if (!(CERT_ENV_OPTIONS as readonly string[]).includes(row.environment)) {
      errors.push('environment must be E1, E2, or E3')
    }
  }

  return errors
}

export const CERT_FIELDS = { AMEX_FIELDS, NON_AMEX_FIELDS }
