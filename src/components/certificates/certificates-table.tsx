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
import { ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, X, CheckCircle, XCircle, Clock } from 'lucide-react'

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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Certificate } from '@/hooks/use-certificates'
import { formatDate } from '@/hooks/use-certificates'
import { useTeamStore } from '@/store/team-store'

type FilterCriteria = {
  field: string
  operator: string
  value: string | string[]
}

type AdvFilters = {
  expiresIn?: '30' | '60' | '90' | null
  status?: string[]
  environment?: string[]
  purpose?: string[]
  hostname?: string
  issuer?: string
  team?: string
  customFilters: FilterCriteria[]
}

interface CertificateTableProps {
  data: Certificate[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
}

const statusIcons: Record<string, React.ReactNode> = {
  Issued: <CheckCircle className="h-4 w-4 text-green-500" />,
  Expired: <XCircle className="h-4 w-4 text-destructive" />,
  Pending: <Clock className="h-4 w-4 text-amber-500" />,
  Revoked: <XCircle className="h-4 w-4 text-gray-500" />,
}

const statusColors: Record<string, string> = {
  Issued: 'bg-green-100 text-green-800 hover:bg-green-200/80',
  Expired: 'bg-red-100 text-red-800 hover:bg-red-200/80',
  Pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200/80',
  Revoked: 'bg-gray-100 text-gray-800 hover:bg-gray-200/80',
}

// Function to highlight search matches in text
function HighlightedText({ text, highlight }: { text: string, highlight: string }) {
  if (!highlight.trim() || !text) return <span>{text}</span>
  
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

// Function to calculate days until certificate expiration
export function getDaysUntilExpiration(validTo: string): number | null {
  if (!validTo) return null
  
  const validToDate = new Date(validTo)
  const today = new Date()
  
  // Clear time part for accurate day calculation
  validToDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  const diffTime = validToDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

export function CertificatesTable({ data, isLoading, isError, error }: CertificateTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'validTo', desc: false }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [expirationFilter, setExpirationFilter] = React.useState<string | null>(null)
  const { selectedTeam } = useTeamStore()
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    certificateIdentifier: false,
    currentCert: false,
    subjectAlternateNames: false,
    zeroTouch: false,
    idaasIntegrationId: false,
    isAmexCert: false,
    acknowledgedBy: false,
    centralID: false,
    comment: false,
    lastNotification: false,
    lastNotificationOn: false,
    changeNumber: false,
    keystorePath: false,
  })

  // Extract unique values for filter dropdowns
  const availableStatuses = React.useMemo(() => {
    return Array.from(new Set(data.map(cert => cert.certificateStatus)))
      .filter(status => status && status.trim() !== '')
  }, [data])
  
  const availableEnvironments = React.useMemo(() => {
    return Array.from(new Set(data.map(cert => cert.environment)))
  }, [data])
  
  const availablePurposes = React.useMemo(() => {
    return Array.from(new Set(data.map(cert => cert.certificatePurpose)))
  }, [data])
  
  const availableTeams = React.useMemo(() => {
    const hostingTeams = data.map(cert => cert.hostingTeamName)
    const renewingTeams = data.map(cert => cert.renewingTeamName)
    return Array.from(new Set([...hostingTeams, ...renewingTeams].filter(Boolean)))
  }, [data])

  // Apply team, expiration and status filters to data
  const filteredData = React.useMemo(() => {
    let filtered = [...data]

    // First filter by selected team
    if (selectedTeam) {
      filtered = filtered.filter(cert => 
        cert.hostingTeamName === selectedTeam || 
        cert.renewingTeamName === selectedTeam
      )
    }

    // Apply expiration filter
    if (expirationFilter) {
      const daysToExpire = parseInt(expirationFilter)
      filtered = filtered.filter(cert => {
        const daysUntil = getDaysUntilExpiration(cert.validTo)
        return daysUntil !== null && daysUntil <= daysToExpire
      })
    }

    // Apply status filter (moved from table filtering to this pre-filter step)
    if (statusFilter.length > 0) {
      filtered = filtered.filter(cert => statusFilter.includes(cert.certificateStatus))
    }

    return filtered
  }, [data, selectedTeam, expirationFilter, statusFilter])

  // Clear all filters
  const clearFilters = () => {
    setExpirationFilter(null)
    setStatusFilter([])
    setGlobalFilter("")
    // Reset table filters
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  // Handle expiration filter change
  const handleExpirationFilterChange = (value: string) => {
    setExpirationFilter(value === "" ? null : value)
  }

  // Handle status filter change
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatusFilter(prev => [...prev, status])
    } else {
      setStatusFilter(prev => prev.filter(s => s !== status))
    }
  }

  // Function to filter data globally across all searchable fields
  const fuzzyFilter = React.useCallback(
    (row: any, columnId: string, filterValue: string, addMeta: any) => {
      // Skip non-string values
      if (typeof row.getValue(columnId) !== 'string') return false
      
      const itemValue = String(row.getValue(columnId)).toLowerCase()
      return itemValue.includes(filterValue.toLowerCase())
    },
    []
  )

  // Generate array of all searchable fields
  const searchableFields = React.useMemo(() => [
    'commonName', 'certificateStatus', 'certificatePurpose', 
    'environment', 'issuerCertAuthName', 'hostingTeamName', 
    'renewingTeamName', 'applicationName', 'serverName', 
    'serialNumber', 'uri', 'certType', 'validFrom', 'validTo',
    'certificateIdentifier', 'currentCert', 'subjectAlternateNames',
    'zeroTouch', 'idaasIntegrationId', 'isAmexCert', 'acknowledgedBy',
    'centralID', 'comment', 'lastNotification', 'lastNotificationOn',
    'changeNumber', 'keystorePath'
  ], [])

  // Define the columns first
  const columns: ColumnDef<Certificate>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <div className="font-medium">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'commonName',
      header: ({ column }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Common Name
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const value = row.getValue('commonName') as string
        return (
          <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
            {globalFilter ? (
              <HighlightedText text={value} highlight={globalFilter} />
            ) : (
              value
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'certificateStatus',
      header: ({ column }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent flex items-center"
          >
            Status
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue('certificateStatus') as string
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={statusColors[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-200/80'}
            >
              {statusIcons[status] && <span className="mr-1">{statusIcons[status]}</span>}
              {globalFilter ? (
                <HighlightedText text={status} highlight={globalFilter} />
              ) : (
                status
              )}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'certificatePurpose',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Purpose
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const purpose = row.getValue('certificatePurpose') as string
        return <div>{globalFilter ? <HighlightedText text={purpose} highlight={globalFilter} /> : purpose}</div>
      },
    },
    {
      accessorKey: 'environment',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Environment
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const env = row.getValue('environment') as string
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100/80">
            {globalFilter ? <HighlightedText text={env} highlight={globalFilter} /> : env}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'validFrom',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Valid From
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const validFrom = row.getValue('validFrom') as string
        const formattedDate = formatDate(validFrom)
        return globalFilter ? (
          <HighlightedText text={formattedDate} highlight={globalFilter} />
        ) : (
          formattedDate
        )
      },
      sortingFn: (rowA, rowB, columnId) => {
        const a = new Date(rowA.getValue(columnId)).getTime()
        const b = new Date(rowB.getValue(columnId)).getTime()
        return a < b ? -1 : a > b ? 1 : 0
      },
    },
    {
      accessorKey: 'validTo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Valid To
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const validTo = row.getValue('validTo') as string
        const daysUntil = getDaysUntilExpiration(validTo)
        const formattedDate = formatDate(validTo)
        
        let badgeClass = ''
        if (daysUntil === 0) {
          badgeClass = 'text-destructive'
        } else if (daysUntil && daysUntil <= 30) {
          badgeClass = 'text-orange-600'
        } else if (daysUntil && daysUntil <= 60) {
          badgeClass = 'text-amber-600'
        } else if (daysUntil && daysUntil <= 90) {
          badgeClass = 'text-blue-600'
        }
        
        return (
          <div className="flex flex-col">
            <span>
              {globalFilter ? (
                <HighlightedText text={formattedDate} highlight={globalFilter} />
              ) : (
                formattedDate
              )}
            </span>
            {daysUntil !== null && daysUntil < 90 && (
              <span className={`text-xs font-medium ${badgeClass}`}>
                {daysUntil === 0 ? 'Expired' : `Expires in ${daysUntil} days`}
              </span>
            )}
          </div>
        )
      },
      sortingFn: (rowA, rowB, columnId) => {
        const a = new Date(rowA.getValue(columnId)).getTime()
        const b = new Date(rowB.getValue(columnId)).getTime()
        return a < b ? -1 : a > b ? 1 : 0
      },
    },
    {
      accessorKey: 'serialNumber',
      header: 'Serial Number',
      cell: ({ row }) => {
        const serial = row.getValue('serialNumber') as string
        return (
          <div className="font-mono text-xs">
            {globalFilter ? <HighlightedText text={serial} highlight={globalFilter} /> : serial}
          </div>
        )
      },
    },
    {
      accessorKey: 'issuerCertAuthName',
      header: 'Issuer',
      cell: ({ row }) => {
        const issuer = row.getValue('issuerCertAuthName') as string
        return <div>{globalFilter ? <HighlightedText text={issuer} highlight={globalFilter} /> : issuer}</div>
      },
    },
    {
      accessorKey: 'hostingTeamName',
      header: 'Hosting Team',
      cell: ({ row }) => {
        const team = row.getValue('hostingTeamName') as string
        return <div>{globalFilter ? <HighlightedText text={team} highlight={globalFilter} /> : team}</div>
      },
    },
    {
      accessorKey: 'applicationName',
      header: 'Application',
      cell: ({ row }) => {
        const app = row.getValue('applicationName') as string
        return <div>{globalFilter ? <HighlightedText text={app} highlight={globalFilter} /> : app}</div>
      },
    },
    {
      accessorKey: 'serverName',
      header: 'Server',
      cell: ({ row }) => {
        const server = row.getValue('serverName') as string
        return <div>{globalFilter ? <HighlightedText text={server} highlight={globalFilter} /> : server}</div>
      },
    },
    {
      accessorKey: 'uri',
      header: 'URI',
      cell: ({ row }) => {
        const uri = row.getValue('uri') as string
        if (!uri) return null
        
        const displayUri = uri.replace(/^https?:\/\//, '').substring(0, 25) + 
          (uri.replace(/^https?:\/\//, '').length > 25 ? '...' : '')
        
        return (
          <a 
            href={uri} 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            {globalFilter ? <HighlightedText text={displayUri} highlight={globalFilter} /> : displayUri}
          </a>
        )
      },
    },
    {
      accessorKey: 'certType',
      header: 'Certificate Type',
      cell: ({ row }) => {
        const certType = row.getValue('certType') as string
        return <div>{globalFilter ? <HighlightedText text={certType} highlight={globalFilter} /> : certType}</div>
      },
    },
    {
      accessorKey: 'renewingTeamName',
      header: 'Renewing Team',
      cell: ({ row }) => {
        const team = row.getValue('renewingTeamName') as string
        return <div>{globalFilter ? <HighlightedText text={team} highlight={globalFilter} /> : team}</div>
      },
    },
    {
      accessorKey: 'certificateIdentifier',
      header: 'Certificate Identifier',
      cell: ({ row }) => {
        const id = row.getValue('certificateIdentifier') as string
        return <div className="font-mono text-xs truncate max-w-[180px]">
          {globalFilter ? <HighlightedText text={id} highlight={globalFilter} /> : id}
        </div>
      },
    },
    {
      accessorKey: 'currentCert',
      header: 'Current Cert',
      cell: ({ row }) => {
        const current = row.getValue('currentCert') as string
        return <div>{current === 'true' ? 'Yes' : 'No'}</div>
      },
    },
    {
      accessorKey: 'subjectAlternateNames',
      header: 'Subject Alternate Names',
      cell: ({ row }) => {
        const sans = row.getValue('subjectAlternateNames') as string
        return <div className="truncate max-w-[180px]">
          {globalFilter ? <HighlightedText text={sans} highlight={globalFilter} /> : sans}
        </div>
      },
    },
    {
      accessorKey: 'zeroTouch',
      header: 'Zero Touch',
      cell: ({ row }) => {
        const zeroTouch = row.getValue('zeroTouch') as string
        return <div>{zeroTouch === 'true' ? 'Yes' : 'No'}</div>
      },
    },
    {
      accessorKey: 'idaasIntegrationId',
      header: 'IDaaS Integration ID',
      cell: ({ row }) => {
        const id = row.getValue('idaasIntegrationId') as string
        return <div className="font-mono text-xs truncate max-w-[180px]">
          {globalFilter ? <HighlightedText text={id} highlight={globalFilter} /> : id}
        </div>
      },
    },
    {
      accessorKey: 'isAmexCert',
      header: 'Is Amex Cert',
      cell: ({ row }) => {
        const isAmex = row.getValue('isAmexCert') as string
        return <div>{isAmex}</div>
      },
    },
    {
      accessorKey: 'acknowledgedBy',
      header: 'Acknowledged By',
      cell: ({ row }) => {
        const name = row.getValue('acknowledgedBy') as string
        return <div>{globalFilter ? <HighlightedText text={name} highlight={globalFilter} /> : name}</div>
      },
    },
    {
      accessorKey: 'centralID',
      header: 'Central ID',
      cell: ({ row }) => {
        const id = row.getValue('centralID') as string
        return <div>{globalFilter ? <HighlightedText text={id} highlight={globalFilter} /> : id}</div>
      },
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ row }) => {
        const comment = row.getValue('comment') as string
        return comment ? <div>{globalFilter ? <HighlightedText text={comment} highlight={globalFilter} /> : comment}</div> : <div className="text-muted-foreground text-sm italic">No comment</div>
      },
    },
    {
      accessorKey: 'lastNotification',
      header: 'Last Notification',
      cell: ({ row }) => {
        const notification = row.getValue('lastNotification') as number
        return <div>{notification ? notification : '-'}</div>
      },
    },
    {
      accessorKey: 'lastNotificationOn',
      header: 'Last Notification On',
      cell: ({ row }) => {
        const date = row.getValue('lastNotificationOn') as string
        const formattedDate = date ? formatDate(date) : '-'
        return <div>{globalFilter && date ? <HighlightedText text={formattedDate} highlight={globalFilter} /> : formattedDate}</div>
      },
    },
    {
      accessorKey: 'changeNumber',
      header: 'Change Number',
      cell: ({ row }) => {
        const changeNumber = row.getValue('changeNumber') as string
        return <div>{globalFilter ? <HighlightedText text={changeNumber} highlight={globalFilter} /> : changeNumber}</div>
      },
    },
    {
      accessorKey: 'keystorePath',
      header: 'Keystore Path',
      cell: ({ row }) => {
        const path = row.getValue('keystorePath') as string
        return <div className="font-mono text-xs">
          {globalFilter ? <HighlightedText text={path} highlight={globalFilter} /> : path}
        </div>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Renew</DropdownMenuItem>
            <DropdownMenuItem>Revoke</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // Initialize the table
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Enable fuzzy filtering across all searchable columns
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      // Check each searchable field for the search term
      return searchableFields.some(field => {
        let value = row.getValue(field)
        
        // Handle date fields by converting them to formatted strings
        if (field === 'validFrom' || field === 'validTo') {
          if (typeof value === 'string') {
            value = formatDate(value as string)
          }
        }
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(filterValue.toLowerCase())
        }
        return false
      })
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  })

  // Calculate the number of active filters
  const hasActiveFilters = globalFilter || statusFilter.length > 0 || expirationFilter !== null

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading certificates...</p>
      </div>
    </div>
  )
  
  if (isError) return (
    <div className="p-8">
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        <p className="font-medium">Error loading certificates</p>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    </div>
  )

  return (
    <Card className="shadow-sm border-border/40">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Certificate Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              View and manage all certificates in the system
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="default" size="sm">
              Add Certificate
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 pr-10"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-1 top-1.5 h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Expiration filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {expirationFilter ? `Expires in ${expirationFilter} days` : "Expiration"}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup 
                  value={expirationFilter || ""} 
                  onValueChange={handleExpirationFilterChange}
                >
                  <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="30">Expires in 30 days</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="60">Expires in 60 days</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="90">Expires in 90 days</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Status {statusFilter.length > 0 && `(${statusFilter.length})`}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {availableStatuses.map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(value) => {
                      handleStatusFilterChange(status, !!value)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {status}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter([])}
                      className="justify-center text-center text-sm text-muted-foreground"
                    >
                      Clear status filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}

            {/* Columns visibility dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Columns <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
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
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Page size selector */}
            <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator className="my-4" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md relative">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-10">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p>No certificates found</p>
                      {globalFilter && (
                        <p className="text-sm">Try adjusting your search criteria</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="border-t flex items-center justify-between p-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-2">
              <span>{table.getFilteredSelectedRowModel().rows.length} row(s) selected</span>
              <Separator orientation="vertical" className="h-4" />
            </div>
          )}
          <span>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </span>
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
            Page{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
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
      </CardFooter>
    </Card>
  )
} 