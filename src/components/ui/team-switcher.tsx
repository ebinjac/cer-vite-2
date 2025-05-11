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
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTeamStore } from '@/store/team-store'

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
  const { selectedTeam, setSelectedTeam } = useTeamStore()

  // Comment out the useTeams hook for now
  // const { teams, isLoading, isError } = useTeams()

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
          <CommandEmpty>No team found.</CommandEmpty>
          <CommandGroup>
            {MOCK_TEAMS.map((team) => (
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
        </Command>
      </PopoverContent>
    </Popover>
  )
} 