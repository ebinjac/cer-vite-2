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

type ApiResponse = string[] | { teams?: string[] | string } | { [key: string]: unknown }

export function TeamSwitcher() {
  const [open, setOpen] = React.useState(false)
  const { selectedTeam, setSelectedTeam, availableTeams, setAvailableTeams } = useTeamStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(TEAMS_API)
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`)
        }
        
        // Get the response text first
        const responseText = await response.text()
        console.log('Raw API response:', responseText) // Debug log
        
        // Handle malformed array response
        if (responseText.startsWith('[') && responseText.endsWith(']')) {
          // Clean and parse the array string
          const cleanedText = responseText
            .slice(1, -1) // Remove [ and ]
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
          
          console.log('Processed teams:', cleanedText)
          setAvailableTeams(cleanedText)
          return
        }
        
        // Try to parse as regular JSON if not a malformed array
        let data: ApiResponse
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError)
          throw new Error('Invalid JSON response from API')
        }
        
        console.log('Parsed Teams API response:', data)
        
        // Handle the API response
        let teams: string[] = []
        
        if (Array.isArray(data)) {
          teams = data
        } else if (data && typeof data === 'object') {
          // Try to find an array in the response
          const possibleTeams = Object.values(data).find((value): value is string[] => Array.isArray(value))
          if (possibleTeams) {
            teams = possibleTeams
          } else if (typeof data.teams === 'string') {
            teams = data.teams.split(',').map((team: string) => team.trim())
          }
        }
        
        console.log('Processed teams:', teams)
        
        if (!Array.isArray(teams) || teams.length === 0) {
          setError('No teams available from the API')
          return
        }
        
        // Validate that all teams are strings
        teams = teams.filter((team): team is string => typeof team === 'string' && team.trim() !== '')
        
        if (teams.length === 0) {
          setError('No valid teams found in the API response')
          return
        }
        
        setAvailableTeams(teams)
      } catch (error) {
        console.error('Error fetching teams:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch teams')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [setAvailableTeams])

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
            <CommandGroup>
              {isLoading ? (
                <CommandItem disabled>Loading teams...</CommandItem>
              ) : error ? (
                <CommandItem disabled className="text-red-500">{error}</CommandItem>
              ) : availableTeams.length > 0 ? (
                availableTeams.map((team) => (
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
                ))
              ) : (
                <CommandItem disabled>No teams available</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}