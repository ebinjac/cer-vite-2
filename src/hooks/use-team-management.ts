import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TEAM_MANAGEMENT_API, TEAM_CREATE_API, TEAM_UPDATE_API } from '@/lib/api-endpoints'

export interface TeamManagement {
  "1d": number
  teamName: string
  escalation: string
  alert1: string
  alert2: string
  alert3: string
  snowGroup: string
  functionHandled: 'serviceid' | 'certificate'
  listOfApplicationNames: string
  prcGroup: string
}

export type TeamManagementInput = Omit<TeamManagement, '1d'>

/**
 * Custom hook to fetch team management data
 */
export function useTeamManagement() {
  return useQuery<TeamManagement[]>({
    queryKey: ['teamManagement'],
    queryFn: async () => {
      try {
        const res = await fetch(TEAM_MANAGEMENT_API)
        if (!res.ok) {
          throw new Error(`Failed to fetch team management data: ${res.status} ${res.statusText}`)
        }
        return res.json()
      } catch (error) {
        console.error('Error fetching team management data:', error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Custom hook to create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTeam: TeamManagementInput) => {
      const res = await fetch(TEAM_CREATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeam),
      })

      if (!res.ok) {
        throw new Error(`Failed to create team: ${res.status} ${res.statusText}`)
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamManagement'] })
    },
  })
}

/**
 * Custom hook to update a team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (team: TeamManagementInput) => {
      const res = await fetch(TEAM_UPDATE_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(team),
      })

      if (!res.ok) {
        throw new Error(`Failed to update team: ${res.status} ${res.statusText}`)
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamManagement'] })
    },
  })
} 