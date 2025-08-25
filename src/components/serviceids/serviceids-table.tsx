import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ServiceId } from '@/hooks/use-serviceids'
import {
  getDaysUntilExpiration as originalGetDaysUntilExpiration,
  getServiceIdCustomStatus as originalGetServiceIdCustomStatus,
  customStatusIcons,
  type ServiceIdCustomStatus
} from '@/hooks/use-serviceids'
import { useTeamStore } from '@/store/team-store'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'

import { useServiceIds } from '@/hooks/use-serviceids'
import ServiceIdForm from './serviceid-form'
import BulkServiceIdUpload from './bulk-serviceid-upload'
import { ServiceIdDetailsModal } from "./serviceid-details-modal"
import { BulkDeleteDialog } from './serviceid-bulk-delete-dialog'

import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTableFilters } from '@/hooks/use-table-filters'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import { MotionCard, MotionCardContent, MotionButton, MotionTableRow } from '@/components/ui/motion-components'
import { downloadTableAsCSV, tableRowVariants } from '@/lib/table-utils'
import { TableSearch } from '@/components/table/table-search'
import { TableFilter } from '@/components/table/table-filter'
import { TablePagination } from '@/components/table/table-pagination'
import { ServiceIdColumns } from './serviceid-columns'
import { ColumnVisibilitySelector } from '../table/column-visibility-dropdown'

interface ServiceIdTableProps {
  data: ServiceId[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
  teamName?: string
}

type AllColumnIds =
  | 'select' | 'actions' | 'svcid' | 'env' | 'application' | 'lastReset'
  | 'expDate' | 'renewalProcess' | 'status' | 'customStatus' | 'acknowledgedBy'
  | 'appCustodian' | 'svcidOwner' | 'appAimId' | 'description' | 'comment'
  | 'lastNotification' | 'lastNotificationOn' | 'renewingTeamName' | 'changeNumber'
  | 'daysLeft'

type ColumnVisibilityState = {
  [K in AllColumnIds]: boolean
}

const initialColumnVisibility: ColumnVisibilityState = {
  select: true,
  svcid: true,
  env: true,
  application: true,
  customStatus: true,
  status: false,
  expDate: true,
  daysLeft: true,
  lastReset: true,
  renewalProcess: false,
  acknowledgedBy: false,
  appCustodian: false,
  svcidOwner: false,
  appAimId: false,
  description: false,
  comment: true,
  lastNotification: false,
  lastNotificationOn: false,
  renewingTeamName: false,
  changeNumber: false,
  actions: true,
}

// Helper functions with safety checks
function getDaysUntilExpiration(validTo: any): number | null {
  try {
    return originalGetDaysUntilExpiration(validTo)
  } catch (error) {
    return null
  }
}

function getServiceIdCustomStatus(validTo: any): ServiceIdCustomStatus {
  try {
    return originalGetServiceIdCustomStatus(validTo)
  } catch (error) {
    return 'Non-Compliant'
  }
}

const ServiceIdsTable = ({ data, isLoading, isError, error, teamName }: ServiceIdTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const { selectedTeam } = useTeamStore()

  // Use shared hooks
  const {
    statusFilter,
    expirationFilter,
    globalFilter,
    hasActiveFilters,
    setGlobalFilter,
    clearFilters,
    handleStatusFilterChange,
    handleExpirationFilterChange
  } = useTableFilters<ServiceIdCustomStatus>()

  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300)

  const {
    columnVisibility,
    setColumnVisibility,
  } = useColumnVisibility(initialColumnVisibility)

  const [selectedServiceId, setSelectedServiceId] = React.useState<ServiceId | null>(null)
  const [showDetailsModal, setShowDetailsModal] = React.useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false)
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = React.useState(false)
  const { refetch } = useServiceIds()

  // Memoized data and table setup
  const availableCustomStatuses = React.useMemo<ServiceIdCustomStatus[]>(() => {
    return ['Valid', 'Expiring Soon', 'Non-Compliant', 'Unknown']
  }, [])

  const availableExpirations = React.useMemo(() => {
    return [
      { value: '30', label: 'Expires in 30 days' },
      { value: '60', label: 'Expires in 60 days' },
      { value: '90', label: 'Expires in 90 days' }
    ]
  }, [])

  const filteredData = React.useMemo(() => {
    try {
      console.log('Filtering data with filters:', { statusFilter, expirationFilter, selectedTeam })
      let filtered = [...data]

      if (selectedTeam) {
        filtered = filtered.filter(svc =>
          svc?.renewingTeamName === selectedTeam
        )
      }

      if (expirationFilter.length > 0) {
        filtered = filtered.filter(svc => {
          const daysUntil = getDaysUntilExpiration(svc?.expDate)
          return daysUntil !== null && expirationFilter.some(days => daysUntil <= parseInt(days))
        })
      }

      if (statusFilter.length > 0) {
        filtered = filtered.filter(svc => {
          const customStatus = getServiceIdCustomStatus(svc?.expDate)
          console.log('Checking status:', customStatus, 'against filters:', statusFilter)
          return statusFilter.includes(customStatus)
        })
      }

      console.log('Filtered data count:', filtered.length)
      return filtered
    } catch (error) {
      console.error("Error filtering data:", error)
      return data
    }
  }, [data, selectedTeam, expirationFilter, statusFilter])

  const shouldUseVirtualization = React.useMemo(() => {
    try {
      return filteredData.length > 100
    } catch (error) {
      return false
    }
  }, [filteredData.length])

  const fuzzyFilter = React.useCallback(
    (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId)
      if (value === null || value === undefined) return false
      const itemValue = String(value).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()
      try {
        return itemValue.includes(searchValue)
      } catch (error) {
        return false
      }
    },
    []
  )

  // Get columns from separate file
  const columns = ServiceIdColumns(globalFilter, setSelectedServiceId, setShowDetailsModal, refetch)

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // Setup the table
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function'
        ? updater(columnVisibility)
        : updater
      setColumnVisibility(prev => ({
        ...prev,
        ...newVisibility
      }))
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: React.useCallback(getCoreRowModel(), []),
    getSortedRowModel: React.useCallback(getSortedRowModel(), []),
    getFilteredRowModel: React.useCallback(getFilteredRowModel(), []),
    getPaginationRowModel: React.useCallback(getPaginationRowModel(), []),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
      columnVisibility,
      rowSelection,
    },
  })

  const getFormattedColumnName = (columnId: string): string => {
    const columnMap: Record<string, string> = {
      select: 'Select',
      svcid: 'Service ID',
      env: 'Environment',
      application: 'Application',
      lastReset: 'Last Reset',
      expDate: 'Expiration Date',
      renewalProcess: 'Renewal Process',
      status: 'Status',
      customStatus: 'Custom Status',
      acknowledgedBy: 'Acknowledged By',
      appCustodian: 'App Custodian',
      svcidOwner: 'Svc ID Owner',
      appAimId: 'App Aim ID',
      description: 'Description',
      comment: 'Comment',
      lastNotification: 'Last Notification',
      lastNotificationOn: 'Last Notification On',
      renewingTeamName: 'Renewing Team',
      changeNumber: 'Change Number',
      daysLeft: 'Days Left',
    }

    return columnMap[columnId] || columnId.replace(/([A-Z])/g, ' $1').trim()
  }

  // Create filter options
  const statusFilterOptions = availableCustomStatuses.map(status => ({
    value: status,
    label: status,
    icon: customStatusIcons[status]
  }))

  const expirationFilterOptions = availableExpirations

  if (isLoading) return (
    <MotionCard
      className="shadow-sm border-border/40 p-8 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <motion.div
          className="rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
          animate={{
            rotate: 360,
            borderColor: ["#3b82f6", "#10b981", "#8b5cf6", "#3b82f6"]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear"
          }}
        />
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading service IDs...
        </motion.p>
      </div>
    </MotionCard>
  )

  if (isError) return (
    <MotionCard
      className="shadow-sm border-border/40 p-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        <motion.p
          className="font-medium"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Error loading service IDs
        </motion.p>
        <motion.p
          className="text-sm mt-1"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {error instanceof Error ? error.message : 'Unknown error'}
        </motion.p>
      </div>
    </MotionCard>
  )

  return (
    <MotionCard
      className="shadow-sm border-border/40"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Service ID Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              {teamName ? (
                <>Managing service IDs for <motion.span
                  className="font-medium text-primary"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >{teamName}</motion.span> team</>
              ) : (
                <>View and manage all service IDs in the system</>
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Drawer open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen} direction="right">
              <DrawerTrigger asChild>
                <MotionButton
                  variant="default"
                  size="sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Add Service ID
                </MotionButton>
              </DrawerTrigger>
              <DrawerContent className="min-w-[750px] ml-auto h-full">
                <DrawerHeader className="border-b">
                  <DrawerTitle>Create New Service ID</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto flex-1 h-[calc(100vh-4rem)]">
                  <div className="p-4">
                    <ServiceIdForm onSuccess={() => {
                      setIsAddDrawerOpen(false)
                      if (refetch) refetch()
                    }} />
                  </div>
                </div>
                <DrawerClose />
              </DrawerContent>
            </Drawer>
            <Drawer open={isBulkDrawerOpen} onOpenChange={setIsBulkDrawerOpen} direction="right">
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  Bulk Upload
                </Button>
              </DrawerTrigger>
              <DrawerContent className="min-w-[90vw] max-w-[90vw] ml-auto h-full">
                <DrawerHeader className="border-b">
                  <DrawerTitle>Bulk Upload Service IDs</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto flex-1 h-[calc(100vh-4rem)]">
                  <div className="p-4">
                    <BulkServiceIdUpload onUploadSuccess={() => {
                      setIsBulkDrawerOpen(false)
                      if (refetch) refetch()
                    }} />
                  </div>
                </div>
                <DrawerClose />
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
          <TableSearch
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            placeholder="Search service IDs..."
          />
          <div className="flex flex-wrap items-center gap-2">
            {/* CSV Export Button */}
            <MotionButton
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => downloadTableAsCSV(
                table.getFilteredRowModel().rows.map(row => row.original),
                table.getVisibleLeafColumns().map(col => col.id),
                getFormattedColumnName,
                'serviceids'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </MotionButton>

            <TableFilter
              title="Expiration"
              options={expirationFilterOptions}
              selectedValues={expirationFilter}
              onFilterChange={handleExpirationFilterChange}
              onClearFilter={() => handleExpirationFilterChange('', false)}
            />

            <TableFilter
              title="Status"
              options={statusFilterOptions}
              selectedValues={statusFilter}
              onFilterChange={(value, checked) => handleStatusFilterChange(value as ServiceIdCustomStatus, checked)}
              onClearFilter={() => handleStatusFilterChange('Valid' as ServiceIdCustomStatus, false)}
            />

            {/* Clear filters button */}
            <AnimatePresence>
              {hasActiveFilters && (
                <MotionButton
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </MotionButton>
              )}
            </AnimatePresence>
            <ColumnVisibilitySelector table={table} />
          </div>
        </div>

      </CardHeader>
      <MotionCardContent className="p-0">
        <div className="relative rounded-md border">
          <div
            className="relative overflow-auto"
            ref={tableContainerRef}
            style={{ height: shouldUseVirtualization ? '500px' : 'auto' }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <React.Fragment key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const isFixed = header.column.id === 'select' || header.column.id === 'svcid' || header.column.id === 'actions'

                        return (
                          <TableHead
                            key={header.id}
                            className={`h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${isFixed ? 'sticky bg-background' : ''
                              } ${header.column.id === 'select' ? 'left-0 w-[28px] z-30' : ''
                              } ${header.column.id === 'svcid' ? 'left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb]' : ''
                              } ${header.column.id === 'actions' ? 'right-0 z-20' : ''
                              } ${header.column.id === 'comment' ? 'max-w-[400px]' : ''
                              }`}
                            style={{
                              minWidth: header.column.id === 'select' ? '28px' : undefined,
                              width: header.column.id === 'select' ? '28px' : undefined
                            }}
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
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="wait">
                  {table.getRowModel().rows?.length ? (
                    <>
                      {table.getRowModel().rows.map((row, index) => (
                        <MotionTableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          custom={index}
                          initial="hidden"
                          animate={row.getIsSelected() ? {
                            opacity: 1,
                            y: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.03)"
                          } : "visible"}
                          variants={tableRowVariants}
                          whileHover="hover"
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const isFixed = cell.column.id === 'select' || cell.column.id === 'svcid' || cell.column.id === 'actions'
                            return (
                              <TableCell
                                key={cell.id}
                                className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${isFixed ? 'sticky bg-background' : ''
                                  } ${cell.column.id === 'select' ? 'left-0 w-[28px] z-30' : ''
                                  } ${cell.column.id === 'svcid' ? 'left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb] py-3' : ''
                                  } ${cell.column.id === 'actions' ? 'right-0 z-20' : ''
                                  } ${cell.column.id === 'comment' ? 'max-w-[400px]' : ''
                                  }`}
                                style={{
                                  minWidth: cell.column.id === 'select' ? '28px' : undefined,
                                  width: cell.column.id === 'select' ? '28px' : undefined,
                                  maxWidth: cell.column.id === 'svcid' ? '300px' : undefined
                                }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            )
                          })}
                        </MotionTableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            delay: 0.2
                          }}
                          className="flex flex-col items-center justify-center space-y-3 text-muted-foreground"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mb-2"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M9 9h6" />
                            <path d="M9 13h6" />
                            <path d="M9 17h6" />
                          </svg>
                          No service IDs found.
                          <motion.p
                            className="text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.7 }}
                            transition={{ delay: 0.4 }}
                          >
                            Try adjusting your search or filters.
                          </motion.p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </div>
      </MotionCardContent>
      <CardFooter className="border-t flex items-center justify-between p-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <AnimatePresence>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span>{table.getFilteredSelectedRowModel().rows.length} row(s) selected</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className="h-8 px-2"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </motion.div>
            )}
          </AnimatePresence>
          <span>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </span>
        </div>

        <TablePagination table={table} />
      </CardFooter>

      <ServiceIdDetailsModal
        serviceId={selectedServiceId}
        open={showDetailsModal}
        onOpenChange={(open) => {
          setShowDetailsModal(open)
          if (!open) setSelectedServiceId(null)
        }}
      />

      <BulkDeleteDialog
        serviceIds={table.getFilteredSelectedRowModel().rows.map(row => row.original)}
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        onDeleteComplete={() => {
          setRowSelection({})
          if (refetch) refetch()
        }}
      />
    </MotionCard>
  )
}

export default React.memo(ServiceIdsTable)
