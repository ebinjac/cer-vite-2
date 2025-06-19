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
            <TableHead className="sticky left-0 bg-background w-[250px]">Team Name</TableHead>
            <TableHead className="min-w-[120px]">Function</TableHead>
            <TableHead className="min-w-[200px]">Snow Group</TableHead>
            <TableHead className="min-w-[400px]">Applications</TableHead>
            <TableHead className="min-w-[300px]">Escalation</TableHead>
            <TableHead className="sticky right-0 bg-background w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {team.teamName}
              </TableCell>
              <TableCell>
                <Badge variant={team.functionHandled === 'certificate' ? 'default' : 'secondary'}>
                  {team.functionHandled}
                </Badge>
              </TableCell>
              <TableCell>{team.snowGroup}</TableCell>
              <TableCell className="whitespace-pre-wrap break-words">
                {team.listOfApplicationNames.split(',').map((app, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="mr-1 mb-1"
                  >
                    {app.trim()}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="whitespace-pre-wrap break-words">
                {team.escalation.split(',').map((email, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="mr-1 mb-1"
                  >
                    {email.trim()}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="sticky right-0 bg-background">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(team)}
                  className="h-8 px-2 flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </div>
  )
} 