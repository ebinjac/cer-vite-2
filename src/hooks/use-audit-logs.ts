import { useQuery } from '@tanstack/react-query'
import { AUDIT_LOGS_API } from '@/lib/api-endpoints'

interface AuditLog {
  id: number
  cerserAuditRecord: string
}

async function fetchAuditLogs(): Promise<AuditLog[]> {
  const response = await fetch(AUDIT_LOGS_API)
  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`)
  }
  const data = await response.json()
  console.log('Fetched audit logs:', data) // Debug log
  return data
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: 2, // Retry failed requests twice
  })
} 