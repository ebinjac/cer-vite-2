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
import type { Certificate } from '@/hooks/use-certificates'
import { 
  getDaysUntilExpiration as originalGetDaysUntilExpiration, 
  getCertificateCustomStatus as originalGetCertificateCustomStatus,
  getStatusIcons,
  type CertificateCustomStatus
} from '@/hooks/use-certificates'
import { useTeamStore } from '@/store/team-store'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { CertificateForm } from './certificate-add-drawer-form'
import { BulkCertificateUpload } from './bulk-certificate-upload'
import { CertificateUpdateDrawer } from './certificate-update-drawer'
import { CertificateRenewDrawer } from './certificate-renew-drawer'
import { CertificateDeleteDialog } from './certificate-delete-dialog'
import { BulkDeleteDialog } from './certificate-bulk-delete-dialog'


import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTableFilters } from '@/hooks/use-table-filters'
import { useColumnVisibility } from '@/hooks/use-column-visibility'
import { MotionCard, MotionCardContent, MotionButton, MotionTableRow } from '@/components/ui/motion-components'
import { downloadTableAsCSV, tableRowVariants } from '@/lib/table-utils'
import { TableSearch } from '@/components/table/table-search'
import { TableFilter } from '@/components/table/table-filter'
import { TablePagination } from '@/components/table/table-pagination'
import { CertificateColumns } from './certificate-columns'
import { ColumnVisibilitySelector } from '../table/column-visibility-dropdown'


interface CertificateTableProps {
  data: Certificate[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
  teamName?: string
  onCertificateAdded?: () => void
}

type AllColumnIds = 
  | 'select' | 'actions' | 'commonName' | 'serialNumber' | 'customStatus'
  | 'validFrom' | 'validTo' | 'applicationName' | 'zeroTouch' | 'hostingTeamName'
  | 'certificatePurpose' | 'certificateStatus' | 'comment' | 'certificateIdentifier'
  | 'currentCert' | 'environment' | 'subjectAlternateNames' | 'issuerCertAuthName'
  | 'certType' | 'idaasIntegrationId' | 'isAmexCert' | 'centralID' | 'uri'
  | 'acknowledgedBy' | 'lastNotification' | 'lastNotificationOn' | 'renewingTeamName'
  | 'changeNumber' | 'serverName' | 'keystorePath' | 'daysLeft'

type ColumnVisibilityState = {
  [K in AllColumnIds]: boolean
}

const initialColumnVisibility: ColumnVisibilityState = {
  select: true,
  commonName: true,
  serialNumber: true,
  customStatus: true,
  validFrom: true,
  validTo: true,
  daysLeft: true,
  applicationName: true,
  zeroTouch: true,
  hostingTeamName: true,
  certificatePurpose: true,
  certificateStatus: true,
  comment: true,
  actions: true,
  // Hide other columns initially
  certificateIdentifier: true,
  currentCert: false,
  environment: false,
  subjectAlternateNames: false,
  issuerCertAuthName: false,
  certType: false,
  idaasIntegrationId: false,
  isAmexCert: false,
  centralID: false,
  uri: false,
  acknowledgedBy: false,
  lastNotification: false,
  lastNotificationOn: false,
  renewingTeamName: false,
  changeNumber: false,
  serverName: false,
  keystorePath: false,
}

// Helper functions with safety checks
function getDaysUntilExpiration(validTo: any): number | null {
  try {
    return originalGetDaysUntilExpiration(validTo)
  } catch (error) {
    return null
  }
}

function getCertificateCustomStatus(validTo: any): CertificateCustomStatus {
  try {
    return originalGetCertificateCustomStatus(validTo)
  } catch (error) {
    return 'Expired'
  }
}

export function CertificatesTable({ data, isLoading, isError, error, teamName, onCertificateAdded }: CertificateTableProps) {
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
  } = useTableFilters<CertificateCustomStatus>()
  
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300)
  
  const {
    columnVisibility,
    setColumnVisibility,
  } = useColumnVisibility(initialColumnVisibility)
  
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [bulkDrawerOpen, setBulkDrawerOpen] = React.useState(false)
  const [updateDrawerOpen, setUpdateDrawerOpen] = React.useState(false)
  const [renewDrawerOpen, setRenewDrawerOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  
  // Memoized data and table setup
  const availableCustomStatuses = React.useMemo<CertificateCustomStatus[]>(() => {
    return ['Valid', 'Expiring Soon', 'Expired']
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
      let filtered = [...data]

      if (selectedTeam) {
        filtered = filtered.filter(cert => 
          (cert?.hostingTeamName === selectedTeam || 
           cert?.renewingTeamName === selectedTeam) ?? false
        )
      }

      if (expirationFilter.length > 0) {
        filtered = filtered.filter(cert => {
          const daysUntil = getDaysUntilExpiration(cert?.validTo)
          return daysUntil !== null && expirationFilter.some(days => daysUntil <= parseInt(days))
        })
      }

      if (statusFilter.length > 0) {
        filtered = filtered.filter(cert => {
          const customStatus = getCertificateCustomStatus(cert?.validTo)
          return statusFilter.includes(customStatus)
        })
      }

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
  const columns = CertificateColumns(globalFilter, setSelectedCertificate, setUpdateDrawerOpen, setRenewDrawerOpen, setDeleteDialogOpen, onCertificateAdded)
  
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
  
  // Event handlers
  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleCertificateUpdated = React.useCallback(() => {
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded])

  const handleCertificateRenewed = React.useCallback(() => {
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded])

  const handleCertificateDeleted = React.useCallback(() => {
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded])

  const getSelectedCertificates = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    return selectedRows.map(row => row.original)
  }, [table])

  const handleBulkDeleteComplete = React.useCallback(() => {
    table.resetRowSelection()
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded, table])

  const getFormattedColumnName = (columnId: string): string => {
    const columnMap: Record<string, string> = {
      select: 'Select',
      commonName: 'Common Name',
      serialNumber: 'Serial Number',
      customStatus: 'Status',
      validFrom: 'Valid From',
      validTo: 'Valid To',
      applicationName: 'Application',
      zeroTouch: 'Zero Touch',
      hostingTeamName: 'Hosting Team',
      certificatePurpose: 'Purpose',
      certificateStatus: 'Certificate Status',
      comment: 'Comment',
      certificateIdentifier: 'Certificate Identifier',
      currentCert: 'Current Cert',
      environment: 'Environment',
      subjectAlternateNames: 'Subject Alternate Names',
      issuerCertAuthName: 'Issuer',
      certType: 'Certificate Type',
      idaasIntegrationId: 'IDaaS Integration ID',
      isAmexCert: 'Is Amex Cert',
      centralID: 'Central ID',
      uri: 'URI',
      acknowledgedBy: 'Acknowledged By',
      lastNotification: 'Last Notification',
      lastNotificationOn: 'Last Notification On',
      renewingTeamName: 'Renewing Team',
      changeNumber: 'Change Number',
      serverName: 'Server',
      keystorePath: 'Keystore Path',
      daysLeft: 'Days Left',
    }

    return columnMap[columnId] || columnId.replace(/([A-Z])/g, ' $1').trim()
  }

  // Create filter options
  const statusFilterOptions = availableCustomStatuses.map(status => ({
    value: status,
    label: status,
    icon: getStatusIcons[status as keyof typeof getStatusIcons]
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
          Loading certificates...
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
          Error loading certificates
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
            <CardTitle className="text-xl font-semibold">Certificate Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              {teamName ? (
                <>Managing certificates for <motion.span 
                  className="font-medium text-primary"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >{teamName}</motion.span> team</>
              ) : (
                <>View and manage all certificates in the system</>
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <MotionButton 
                  variant="default" 
                  size="sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Add Certificate
                </MotionButton>
              </DrawerTrigger>
              <DrawerContent className="min-w-[750px] max-w-4xl ml-auto">
                <DrawerHeader>
                  <DrawerTitle>Add Certificate</DrawerTitle>
                </DrawerHeader>
                <CertificateForm onSuccess={handleDrawerClose} />
              </DrawerContent>
            </Drawer>
            <Drawer direction="right" open={bulkDrawerOpen} onOpenChange={setBulkDrawerOpen}>
              <DrawerTrigger asChild>
                <MotionButton 
                  variant="outline" 
                  size="sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Bulk Upload
                </MotionButton>
              </DrawerTrigger>
              <DrawerContent className="min-w-[90vw] max-w-[90vw] ml-auto">
                <DrawerHeader>
                  <DrawerTitle>Bulk Certificate Upload</DrawerTitle>
                </DrawerHeader>
                <BulkCertificateUpload onUploadSuccess={() => {
                  setBulkDrawerOpen(false)
                  if (onCertificateAdded) onCertificateAdded()
                }} />
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
          <TableSearch 
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            placeholder="Search certificates..."
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
                'certificates'
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
              onFilterChange={(value, checked) => handleStatusFilterChange(value as CertificateCustomStatus, checked)}
              onClearFilter={() => handleStatusFilterChange('Valid' as CertificateCustomStatus, false)}
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
                        const isFixed = header.column.id === 'select' || header.column.id === 'commonName' || header.column.id === 'actions'
                        
                        return (
                          <TableHead
                            key={header.id}
                            className={`h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${
                              isFixed ? 'sticky bg-background' : ''
                            } ${
                              header.column.id === 'select' ? 'left-0 w-[28px] z-30' : ''
                            } ${
                              header.column.id === 'commonName' ? 'left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb]' : ''
                            } ${
                              header.column.id === 'actions' ? 'right-0 z-20' : ''
                            } ${
                              header.column.id === 'comment' ? 'max-w-[400px]' : ''
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
                            const isFixed = cell.column.id === 'select' || cell.column.id === 'commonName' || cell.column.id === 'actions'
                            return (
                              <TableCell
                                key={cell.id}
                                className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${
                                  isFixed ? 'sticky bg-background' : ''
                                } ${
                                  cell.column.id === 'select' ? 'left-0 w-[28px] z-30' : ''
                                } ${
                                  cell.column.id === 'commonName' ? 'left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb] py-3' : ''
                                } ${
                                  cell.column.id === 'actions' ? 'right-0 z-20' : ''
                                } ${
                                  cell.column.id === 'comment' ? 'max-w-[400px]' : ''
                                }`}
                                style={{
                                  minWidth: cell.column.id === 'select' ? '28px' : undefined,
                                  width: cell.column.id === 'select' ? '28px' : undefined,
                                  maxWidth: cell.column.id === 'commonName' ? '300px' : undefined
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
                          No certificates found.
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
                <Separator orientation="vertical" className="h-4" />
                <MotionButton
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-8 px-2 py-0"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Selected
                </MotionButton>
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
      
      <CertificateUpdateDrawer
        certificate={selectedCertificate}
        open={updateDrawerOpen}
        onOpenChange={setUpdateDrawerOpen}
        onCertificateUpdated={handleCertificateUpdated}
      />
      
      <CertificateRenewDrawer
        certificate={selectedCertificate}
        open={renewDrawerOpen}
        onOpenChange={setRenewDrawerOpen}
        onCertificateRenewed={handleCertificateRenewed}
      />
      
      <CertificateDeleteDialog
        certificate={selectedCertificate}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onCertificateDeleted={handleCertificateDeleted}
      />
      
      <BulkDeleteDialog
        certificates={getSelectedCertificates()}
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onDeleteComplete={handleBulkDeleteComplete}
      />
    </MotionCard>
  )
}

export default React.memo(CertificatesTable)
