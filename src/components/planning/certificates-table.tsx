'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import { useState, useCallback, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronDown, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  X,
  Filter,
  ListFilter,
  Users
} from 'lucide-react'

import { useTeamStore } from '@/store/team-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { CertificateChecklistDrawer } from '@/components/planning/certificate-checklist-drawer'
import type {
  PlanCertificate,
  CertificateChecklist,
  CertificateStatus
} from '@/hooks/use-plan-certificates'
import { CERTIFICATE_RENEW_API } from '@/lib/api-endpoints'
import { toast } from 'sonner'

// Helper function to format dates
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Helper function to format long dates with time
const formatDateLong = (dateString: string | null): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

type CertificateTableProps = {
  data: PlanCertificate[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  parseChecklist: (checklistStr: string) => CertificateChecklist
  updateCertificateChecklist: (id: number, updates: Partial<CertificateChecklist>, comment: string) => Promise<boolean>
}

// Status Badge Component
const StatusBadge = ({ status }: { status: CertificateStatus }) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 gap-1 items-center">
          <CheckCircle className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 gap-1 items-center">
          <AlertCircle className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      )
    case 'continue':
      return (
        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 gap-1 items-center">
          <Clock className="h-3 w-3" />
          <span>Continue</span>
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// Button for showing checklist with appropriate color
const ChecklistButton = ({ 
  certificate, 
  checklist, 
  onClick 
}: { 
  certificate: PlanCertificate, 
  checklist: CertificateChecklist,
  onClick: () => void 
}) => {
  // Count checked items
  const totalItems = Object.keys(checklist).length
  const checkedItems = Object.values(checklist).filter(Boolean).length
  
  // Determine status
  let status: CertificateStatus
  if (checkedItems === 0) status = 'pending'
  else if (checkedItems === totalItems) status = 'completed'
  else status = 'continue'
  
  let className = "gap-1.5"
  switch (status) {
    case 'completed':
      className += " bg-green-500 hover:bg-green-600"
      break
    case 'pending': 
      className += " bg-amber-500 hover:bg-amber-600"
      break
    case 'continue':
      className += " bg-amber-500 hover:bg-amber-600"
      break
  }
  
  return (
    <Button onClick={onClick} className={className} size="sm">
      {status === 'completed' && <CheckCircle className="h-3.5 w-3.5" />}
      {status === 'pending' && <AlertCircle className="h-3.5 w-3.5" />}
      {status === 'continue' && <Clock className="h-3.5 w-3.5" />}
      <span>{status === 'continue' ? 'Continue' : status === 'completed' ? 'Completed' : 'Pending'}</span>
      <span className="font-mono text-xs opacity-70">
        ({checkedItems}/{totalItems})
      </span>
    </Button>
  )
}

// Add helper to check if all items are checked
const isChecklistComplete = (checklist: CertificateChecklist): boolean => {
  return Object.values(checklist).every(Boolean)
}

export function CertificatesTable({ 
  data, 
  isLoading, 
  isError, 
  error, 
  parseChecklist,
  updateCertificateChecklist
}: CertificateTableProps) {
  // Get the selected team from the team store
  const { selectedTeam } = useTeamStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<PlanCertificate[]>([])
  
  // Filter data based on selected team
  useEffect(() => {
    if (!selectedTeam) {
      setFilteredData(data)
    } else {
      setFilteredData(data.filter(cert => cert.renewingTeamName === selectedTeam))
    }
  }, [data, selectedTeam])
  
  // State for drawer
  const [selectedCertificate, setSelectedCertificate] = useState<PlanCertificate | null>(null)
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false)
  
  // Handle opening the checklist drawer
  const handleOpenChecklist = useCallback((certificate: PlanCertificate) => {
    setSelectedCertificate(certificate)
    setIsChecklistModalOpen(true)
  }, [])
  
  // Enhanced handleSaveChecklist to handle both partial updates and completion
  const handleSaveChecklist = useCallback(async (
    id: number, 
    updates: Partial<CertificateChecklist>,
    comment: string
  ) => {
    try {
      // First, check if this update would complete the checklist
      const certificate = data.find(cert => cert.id === id)
      if (!certificate) {
        throw new Error('Certificate not found')
      }

      const currentChecklist = parseChecklist(certificate.checklist)
      const updatedChecklist = { ...currentChecklist, ...updates }
      const isComplete = isChecklistComplete(updatedChecklist)

      if (isComplete) {
        // If checklist is complete, trigger the second API call to complete the renewal
        const completePayload = {
          id: certificate.id,
          commonName: certificate.commonName,
          serialNumber: certificate.seriatNumber,
          changeNumber: certificate.changeNumber || '',
          renewalDate: certificate.renewalDate,
          renewedBy: certificate.renewedBy || "",
          currentStatus: "completed",
          validTo: certificate.validTo,
          checklist: "1,1,1,1,1,1,1,1,1,1,1,1",
          underRenewal: true,
          comment: comment || "Certificate renewal completed"
        }

        const completeRes = await fetch(CERTIFICATE_RENEW_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(completePayload)
        })

        if (!completeRes.ok) {
          throw new Error('Failed to complete certificate renewal')
        }

        const successMessage = await completeRes.text()
        toast.success('Certificate renewal completed!', {
          description: successMessage
        })

        return true
      } else {
        // If checklist is not complete, just update the checklist
        const updateResult = await updateCertificateChecklist(id, updates, comment)
        if (updateResult) {
          toast.success('Checklist updated', {
            description: 'The certificate checklist has been updated successfully.'
          })
        }
        return updateResult
      }
    } catch (error) {
      console.error('Error updating checklist:', error)
      toast.error('Failed to update checklist', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      })
      return false
    }
  }, [data, parseChecklist, updateCertificateChecklist])
  
  // Define table columns
  const columns = React.useMemo<ColumnDef<PlanCertificate>[]>(() => [
    {
      accessorKey: 'commonName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Common Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('commonName') as string
        return <div className="font-medium">{value}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'seriatNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Serial Number
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('seriatNumber') as string
        return <div className="font-mono text-xs">{value}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'changeNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Change Number
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('changeNumber') as string
        return <div className="font-mono text-xs">{value}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'renewalDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Renewal Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('renewalDate') as string
        return <div>{formatDate(value)}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('renewalDate'));
        const dateB = new Date(rowB.getValue('renewalDate'));
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      accessorKey: 'renewedBy',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Renewed By
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => row.getValue('renewedBy'),
      enableSorting: true,
    },
    {
      accessorKey: 'validTo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Expiry Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('validTo') as string
        return <div>{formatDate(value)}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('validTo'));
        const dateB = new Date(rowB.getValue('validTo'));
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      accessorKey: 'renewingTeamName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          <Users className="mr-1 h-3 w-3" />
          Team
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('renewingTeamName') as string
        return <div className="font-medium">{value || '-'}</div>
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const certificate = row.original
        const checklist = parseChecklist(certificate.checklist)
        
        return (
          <div className="text-right">
            <ChecklistButton 
              certificate={certificate} 
              checklist={checklist}
              onClick={() => handleOpenChecklist(certificate)}
            />
          </div>
        )
      },
      enableSorting: false,
    },
  ], [handleOpenChecklist, parseChecklist])

  // Use filteredData instead of data for the table
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      return String(value).toLowerCase().includes(filterValue.toLowerCase())
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value)
  }

  // Clear filters
  const clearFilters = () => {
    setGlobalFilter('')
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  // Empty state
  if (filteredData.length === 0 && !isLoading && !isError) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-muted p-3">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-lg font-medium">No certificates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no certificates available in the current view.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-red-50 p-3">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="mt-3 text-lg font-medium">Error loading certificates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message || "An unknown error occurred while loading certificates."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {selectedTeam && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Filtering by team: {selectedTeam}
          </Badge>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={globalFilter}
              onChange={handleSearchChange}
              className="w-[250px] pl-8"
            />
            {globalFilter && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="absolute right-0 top-0 h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-9 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span>View</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === 'actions' ? 'Actions' : column.id.replace(/([A-Z])/g, ' $1').trim()}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border w-full overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    // Add className conditionally based on column position
                    const isFirstColumn = index === 0
                    const isLastColumn = index === headerGroup.headers.length - 1
                    const className = isFirstColumn
                      ? "sticky left-0 bg-white dark:bg-background z-10 shadow-[1px_0_0_#e5e7eb]"
                      : isLastColumn
                      ? "sticky right-0 bg-white dark:bg-background z-10 shadow-[-1px_0_0_#e5e7eb]"
                      : ""
                    
                    return (
                      <TableHead 
                        key={header.id} 
                        className={className}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`loading-${i}`}>
                    {Array.from({ length: columns.length }).map((_, j) => {
                      // Add className conditionally based on column position
                      const isFirstColumn = j === 0
                      const isLastColumn = j === columns.length - 1
                      const className = isFirstColumn
                        ? "sticky left-0 bg-white dark:bg-background z-10 shadow-[1px_0_0_#e5e7eb]"
                        : isLastColumn
                        ? "sticky right-0 bg-white dark:bg-background z-10 shadow-[-1px_0_0_#e5e7eb]"
                        : ""
                      
                      return (
                        <TableCell 
                          key={`loading-cell-${i}-${j}`}
                          className={className}
                        >
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      // Add className conditionally based on column position
                      const isFirstColumn = index === 0
                      const isLastColumn = index === row.getVisibleCells().length - 1
                      const className = isFirstColumn
                        ? "sticky left-0 bg-white dark:bg-background z-10 shadow-[1px_0_0_#e5e7eb]"
                        : isLastColumn
                        ? "sticky right-0 bg-white dark:bg-background z-10 shadow-[-1px_0_0_#e5e7eb]"
                        : ""
                      
                      return (
                        <TableCell 
                          key={cell.id}
                          className={className}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <strong>
            {table.getFilteredRowModel().rows.length} of {filteredData.length}
          </strong>{" "}
          certificate(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedCertificate && (
        <CertificateChecklistDrawer
          certificate={selectedCertificate}
          checklist={parseChecklist(selectedCertificate.checklist)}
          open={isChecklistModalOpen}
          onOpenChange={setIsChecklistModalOpen}
          onSave={handleSaveChecklist}
        />
      )}

      {filteredData.length === 0 && !isLoading && selectedTeam && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No certificates found for team "{selectedTeam}".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 