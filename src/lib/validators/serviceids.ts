// lib/validators/serviceIds.ts
import { headersMatch } from '@/lib/csv'

export const SERVICEID_FIELDS = [
  'svcid',
  'env',
  'application',
  'expDate',
  'renewalProcess',
  'comment',
] as const

export const SVC_ENV_OPTIONS = ['E1', 'E2', 'E3'] as const

export type ServiceIdContext = {} // reserved for future if needed

export function guardServiceIdHeaders(headers: string[]) {
  return headersMatch(headers, SERVICEID_FIELDS as unknown as string[])
    ? { ok: true as const, ctx: {} }
    : { ok: false as const, error: 'Invalid CSV template headers' }
}

export function validateServiceIdRow(
  row: Record<string, string>,
  applications: string[]
) {
  const errors: string[] = []

  if (!row.svcid) errors.push('Service ID is required')

  if (!row.env) {
    errors.push('Environment is required')
  } else if (!(SVC_ENV_OPTIONS as readonly string[]).includes(row.env.toUpperCase())) {
    errors.push(`Environment must be one of: ${(SVC_ENV_OPTIONS as readonly string[]).join(', ')}`)
  }

  if (!row.application) {
    errors.push('Application is required')
  } else if (applications.length > 0 && !applications.includes(row.application)) {
    errors.push(`Application must be one of: ${applications.join(', ')}`)
  }

  if (!row.expDate) {
    errors.push('Expiry date is required')
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(row.expDate)) {
      errors.push('Expiry date must be in YYYY-MM-DD format')
    }
  }

  if (!row.renewalProcess) {
    errors.push('Renewal process is required')
  } else if (!['Manual', 'Automated'].includes(row.renewalProcess)) {
    errors.push('Renewal process must be either Manual or Automated')
  }

  return errors
}
