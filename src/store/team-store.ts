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
    (set) => ({
      selectedTeam: 'CloudSecurity', // Default team
      availableTeams: [
        'CloudSecurity',
        'Data-Certs',
        'Mobile-Team',
        'Zmainframe-Certs',
        'Fin-Certs'
      ],
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      setAvailableTeams: (teams) => set({ availableTeams: teams }),
    }),
    {
      name: 'team-storage',
    }
  )
) 