import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil } from "lucide-react"
import type { TeamManagement } from '@/hooks/use-team-management'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface TeamManagementTableProps {
  teams: TeamManagement[]
  onEdit: (team: TeamManagement) => void
}

export function TeamManagementTable({ teams, onEdit }: TeamManagementTableProps) {
  return (
    <div className="relative rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background w-[200px]">Team Name</TableHead>
            <TableHead className="min-w-[100px]">Function</TableHead>
            <TableHead className="min-w-[150px]">Snow Group</TableHead>
            <TableHead className="min-w-[300px]">Applications</TableHead>
            <TableHead className="min-w-[150px]">Escalation</TableHead>
            <TableHead className="sticky right-0 bg-background w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team["1d"]}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {team.teamName}
              </TableCell>
              <TableCell>
                <Badge variant={team.functionHandled === 'certificate' ? 'default' : 'secondary'}>
                  {team.functionHandled}
                </Badge>
              </TableCell>
              <TableCell>{team.snowGroup}</TableCell>
              <TableCell className="max-w-[300px] truncate" title={team.listOfApplicationNames}>
                {team.listOfApplicationNames}
              </TableCell>
              <TableCell>{team.escalation}</TableCell>
              <TableCell className="sticky right-0 bg-background">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(team)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </div>
  )
} 