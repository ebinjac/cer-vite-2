import { useQuery } from '@tanstack/react-query'
import { fetchTeamsApi } from '@/lib/mock-api'
import { useTeamStore } from '@/store/team-store'
import { useEffect } from 'react'

/**
 * Custom hook to fetch and manage teams data
 */
export function useTeams() {
  const { setAvailableTeams, setSelectedTeam, selectedTeam } = useTeamStore()
  
  // Fetch teams using TanStack Query
  const query = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeamsApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  })
  
  const { data: teams, isLoading, isError, error } = query
  
  // Update the store with fetched teams
  useEffect(() => {
    if (teams && teams.length > 0) {
      setAvailableTeams(teams)
      
      // Set selected team if not already set or if current selection is not in the list
      if (!selectedTeam || !teams.includes(selectedTeam)) {
        setSelectedTeam(teams[0])
      }
    }
  }, [teams, selectedTeam, setAvailableTeams, setSelectedTeam])
  
  return {
    teams,
    isLoading,
    isError,
    error
  }
} 