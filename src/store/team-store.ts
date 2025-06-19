import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TeamState = {
  selectedTeam: string
  availableTeams: string[]
  setSelectedTeam: (team: string) => void
  setAvailableTeams: (teams: string[]) => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      selectedTeam: '',
      availableTeams: [],
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      setAvailableTeams: (teams) => {
        if (teams && teams.length > 0) {
          const currentState = get()
          set({ 
            availableTeams: teams,
            // If no team is selected or current team isn't in new list, select first team
            selectedTeam: !currentState.selectedTeam || !teams.includes(currentState.selectedTeam)
              ? teams[0]
              : currentState.selectedTeam
          })
        }
      },
    }),
    {
      name: 'team-storage',
      version: 1,
    }
  )
)