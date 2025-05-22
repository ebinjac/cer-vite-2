import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
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
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MoreHorizontal, Pencil, Search, PlusCircle, ArrowUpDown } from "lucide-react"
import type { TeamManagement } from '@/hooks/use-team-management'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TeamsTableProps {
  data: TeamManagement[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  onEdit: (team: TeamManagement) => void
  onAdd: () => void
}

export function TeamsTable({ data, isLoading, isError, error, onEdit, onAdd }: TeamsTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns: ColumnDef<TeamManagement>[] = [
    {
      accessorKey: "teamName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Team Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("teamName")}</div>
      ),
    },
    {
      accessorKey: "functionHandled",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Function
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const value = row.getValue("functionHandled") as string
        return (
          <Badge variant={value === 'certificate' ? 'default' : 'secondary'}>
            {value}
          </Badge>
        )
      },
    },
    {
      accessorKey: "snowGroup",
      header: "Snow Group",
      cell: ({ row }) => {
        const value = row.getValue("snowGroup") as string
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate">{value}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "listOfApplicationNames",
      header: "Applications",
      cell: ({ row }) => {
        const apps = (row.getValue("listOfApplicationNames") as string).split(',').map(app => app.trim()).filter(Boolean)
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[300px]">
                  {apps.length > 2 ? (
                    <div className="flex gap-1 items-center">
                      <Badge variant="outline" className="whitespace-nowrap">{apps[0]}</Badge>
                      <Badge variant="outline" className="whitespace-nowrap">{apps[1]}</Badge>
                      <Badge variant="secondary" className="whitespace-nowrap">+{apps.length - 2}</Badge>
                    </div>
                  ) : (
                    <div className="flex gap-1 flex-wrap">
                      {apps.map((app, i) => (
                        <Badge key={i} variant="outline" className="whitespace-nowrap">{app}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <div className="flex gap-1 flex-wrap">
                  {apps.map((app, i) => (
                    <Badge key={i} variant="outline">{app}</Badge>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "escalation",
      header: "Escalation",
      cell: ({ row }) => {
        const value = row.getValue("escalation") as string
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate">{value}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "prcGroup",
      header: "PRC Group",
      cell: ({ row }) => {
        const value = row.getValue("prcGroup") as string
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate">{value}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const team = row.original

        return (
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
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      sorting,
    },
  })

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>
            {error?.message || 'An error occurred while fetching teams.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Team Management</CardTitle>
            <CardDescription>
              Manage teams and their configurations for certificates and service IDs.
            </CardDescription>
          </div>
          <Button onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Team
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={(table.getColumn("teamName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("teamName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading teams...
                      </div>
                    ) : (
                      "No teams found."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 