import { useQuery } from '@tanstack/react-query'
import { APPLICATION_LIST_API } from '@/lib/api-endpoints'

function parseApps(text: string): string[] {
  try {
    const j = JSON.parse(text)
    return Array.isArray(j) ? j : []
  } catch {
    return text.replace(/\[|\]/g, '').split(',').map(t => t.trim()).filter(Boolean)
  }
}

export function useApplications(team?: string, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['applications', team],
    enabled: Boolean(team) && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (count) => count < 2,
    queryFn: async ({ signal }) => {
      if (!team) return []
      const res = await fetch(APPLICATION_LIST_API(team), { signal })
      if (!res.ok) throw new Error('Failed to fetch applications')
      return parseApps(await res.text())
    },
  })

  return {
    apps: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
