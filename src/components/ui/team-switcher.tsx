'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

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
import { useTeams } from '@/hooks/use-teams'

export function TeamSwitcher() {
  const [open, setOpen] = React.useState(false)
  const { selectedTeam, setSelectedTeam } = useTeamStore()
  const { teams, isLoading, isError } = useTeams()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading || isError}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading teams...
            </>
          ) : isError ? (
            "Failed to load teams"
          ) : (
            selectedTeam
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandEmpty>No team found.</CommandEmpty>
          <CommandGroup>
            {isLoading ? (
              <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading teams...
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center p-6 text-sm text-destructive">
                Failed to load teams
              </div>
            ) : (
              teams?.map((team) => (
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
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 