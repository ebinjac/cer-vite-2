'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTeamStore } from '@/store/team-store'
import { useEffect } from 'react'
import { TEAMS_API } from '@/lib/api-endpoints'

// Hardcoded teams from mock.json renewingTeamName values
const MOCK_TEAMS = [
  "CloudSecurity",
  "Data-Certs",
  "Mobile-Team",
  "Zmainframe-Certs",
  "Fin-Certs"
] as const

export function TeamSwitcher() {
  const [open, setOpen] = React.useState(false)
  const { selectedTeam, setSelectedTeam, availableTeams, setAvailableTeams } = useTeamStore()
  const [isLoading, setIsLoading] = React.useState(false)

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(TEAMS_API)
        if (!response.ok) {
          throw new Error('Failed to fetch teams')
        }
        const teams = await response.json()
        setAvailableTeams(teams)
      } catch (error) {
        console.error('Error fetching teams:', error)
        // Fallback to some default teams
        setAvailableTeams([
          "CloudSecurity",
          "Data-Certs",
          "Mobile-Team",
          "Zmainframe-Certs",
          "Fin-Certs"
        ])
      } finally {
        setIsLoading(false)
      }
    }

    if (availableTeams.length === 0) {
      fetchTeams()
    }
  }, [availableTeams.length, setAvailableTeams])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedTeam || "Select team"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            {isLoading ? (
              <CommandItem disabled>Loading teams...</CommandItem>
            ) : (
              <CommandGroup>
                {availableTeams.map((team) => (
                  <CommandItem
                    key={team}
                    value={team}
                    onSelect={(currentValue) => {
                      setSelectedTeam(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTeam === team ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {team}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 