import * as React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, RefreshCcw, MoreVertical, AlertTriangle, Loader2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import type { ServiceId } from '@/hooks/use-serviceids'
import {
  customStatusColors,
  customStatusIcons,
  statusColors,
  statusIcons,
  getDaysUntilExpiration as originalGetDaysUntilExpiration,
  getServiceIdCustomStatus as originalGetServiceIdCustomStatus,
} from '@/hooks/use-serviceids'
import { MotionBadge } from '@/components/ui/motion-components'
import { AnimatedColumnHeader } from '@/components/ui/animated-column-header'
import { MotionCheckbox } from '@/components/ui/motion-checkbox'
import { CopyableText } from '@/components/ui/copyable-text'
import { HighlightedText } from '@/components/ui/highlighted-text'
import { MotionDateDisplay } from '@/components/ui/motion-date-display'
import { MotionDaysLeft } from '@/components/ui/motion-days-left'
import { ExpandableComment } from '@/components/ui/expandable-comment'
import ServiceIdUpdateForm from './serviceid-update-form'
import { ServiceIdRenewDrawer } from './serviceid-renew-drawer'
import { formatDate, formatDateLong, statusBadgeVariants } from '@/lib/table-utils'
import { useServiceIds } from '@/hooks/use-serviceids'
import { toast } from 'sonner'
import { SERVICEID_DELETE_API } from '@/lib/api-endpoints'

// Helper functions with safety checks
function getDaysUntilExpiration(validTo: any): number | null {
  try {
    return originalGetDaysUntilExpiration(validTo)
  } catch (error) {
    return null
  }
}

function getServiceIdCustomStatus(validTo: any) {
  try {
    return originalGetServiceIdCustomStatus(validTo)
  } catch (error) {
    return 'Non-Compliant'
  }
}

export function ServiceIdColumns(
  globalFilter: string,
  setSelectedServiceId: (svc: ServiceId) => void,
  setShowDetailsModal: (show: boolean) => void): ColumnDef<ServiceId>[] {
  return [
    // Select column
    {
      id: 'select',
      header: ({ table }) => (
        <MotionCheckbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          label="Select all"
        />
      ),
      cell: ({ row }) => (
        <MotionCheckbox
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(!!value)}
          label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Service ID
    {
      accessorKey: 'svcid',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column} className="p-0 h-auto font-medium">
          Service ID
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const value = row.getValue('svcid') as string
        return (
          <div
            className="font-medium overflow-hidden text-ellipsis min-w-[150px] break-words"
            title={value}
          >
            {globalFilter ? (
              <HighlightedText text={value} highlight={globalFilter} />
            ) : (
              <CopyableText text={value} fieldName="Service ID" />
            )}
          </div>
        )
      },
      enableSorting: true,
    },

    // Compliance Status
    {
      id: 'customStatus',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Compliance Status
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const expDate = row.original.expDate as string
        const status = getServiceIdCustomStatus(expDate)
        return (
          <div className="flex items-center gap-2">
            <MotionBadge
              variant="outline"
              className={customStatusColors[status]}
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={statusBadgeVariants}
            >
              {status && customStatusIcons[status] && (
                <span className="mr-1">{customStatusIcons[status]}</span>
              )}
              {status}
            </MotionBadge>
          </div>
        )
      },
      accessorFn: (row) => {
        const expDate = row.expDate
        const status = getServiceIdCustomStatus(expDate)
        const statusOrder = {
          'Valid': 0,
          'Expiring Soon': 1,
          'Non-Compliant': 2,
          'Unknown': 3,
          'Expired': 4
        }
        return statusOrder[status]
      },
      enableSorting: true,
    },

    // Days Left
    {
      id: 'daysLeft',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Days Left
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const expDate = row.getValue('expDate') as string
        const daysUntil = getDaysUntilExpiration(expDate)
        return <MotionDaysLeft days={daysUntil} expiredText="Non-Compliant" />
      },
      accessorFn: (row) => {
        const expDate = row.expDate
        if (!expDate) return Infinity

        const expDateDate = new Date(expDate)
        const today = new Date()

        expDateDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)

        const diffTime = expDateDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return diffDays > 0 ? diffDays : 0
      },
      enableSorting: true,
    },

    // Last Reset
    {
      accessorKey: 'lastReset',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Last Reset
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const lastReset = row.getValue('lastReset') as string
        return <MotionDateDisplay shortDate={formatDate(lastReset)} longDate={formatDateLong(lastReset)} />
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('lastReset'))
        const dateB = new Date(rowB.getValue('lastReset'))
        return dateA.getTime() - dateB.getTime()
      },
    },

    // Expiration Date
    {
      accessorKey: 'expDate',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Expiration Date
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const expDate = row.getValue('expDate') as string
        return <MotionDateDisplay shortDate={formatDate(expDate)} longDate={formatDateLong(expDate)} />
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('expDate'))
        const dateB = new Date(rowB.getValue('expDate'))
        return dateA.getTime() - dateB.getTime()
      },
    },

    // Application
    {
      accessorKey: 'application',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Application
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const app = row.getValue('application') as string
        return <div>{globalFilter ? <HighlightedText text={app} highlight={globalFilter} /> : app}</div>
      },
      enableSorting: true,
    },

    // Environment
    {
      accessorKey: 'env',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Environment
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const env = row.getValue('env') as string
        return (
          <MotionBadge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100/80"
            initial="initial"
            animate="animate"
            whileHover="hover"
            variants={statusBadgeVariants}
          >
            {globalFilter ? <HighlightedText text={env} highlight={globalFilter} /> : env}
          </MotionBadge>
        )
      },
      enableSorting: true,
    },

    // Status
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Status
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4" /><path d="m7 20V4" /><path d="m21 8-4-4-4 4" /><path d="m17 4v16" /></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const rawStatus = row.original.status
        return (
          <div className="flex items-center gap-2">
            <MotionBadge
              variant="outline"
              className={statusColors[rawStatus] ?? ""}
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={statusBadgeVariants}
            >
              {statusIcons[rawStatus as keyof typeof statusIcons] && (
                <span className="mr-1">{statusIcons[rawStatus as keyof typeof statusIcons]}</span>
              )}
              {rawStatus}
            </MotionBadge>
          </div>
        )
      },
      enableSorting: true,
    },

    // Renewal Process
    {
      accessorKey: 'renewalProcess',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Renewal Process
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4" /><path d="m7 20V4" /><path d="m21 8-4-4-4 4" /><path d="m17 4v16" /></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const process = row.getValue('renewalProcess') as string
        return <div>{globalFilter ? <HighlightedText text={process} highlight={globalFilter} /> : process}</div>
      },
      enableSorting: true,
    },

    // Acknowledged By
    {
      accessorKey: 'acknowledgedBy',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Acknowledged By
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4" /><path d="m7 20V4" /><path d="m21 8-4-4-4 4" /><path d="m17 4v16" /></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue('acknowledgedBy') as string
        return <div>{globalFilter ? <HighlightedText text={name} highlight={globalFilter} /> : name}</div>
      },
      enableSorting: true,
    },

    {
      accessorKey: 'appCustodian',
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
        const changeNumber = row.getValue('changeNumber') as string
        return <div>{globalFilter ? <HighlightedText text={changeNumber} highlight={globalFilter} /> : changeNumber}</div>
      },
      enableSorting: true,
    },

    // Comment
    {
      accessorKey: 'comment',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Comment
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4" /><path d="m7 20V4" /><path d="m21 8-4-4-4 4" /><path d="m17 4v16" /></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const comment = row.getValue('comment') as string
        return <ExpandableComment comment={comment} globalFilter={globalFilter} />
      },
      enableSorting: true,
    },

    // Actions
    {
      id: 'actions',
      cell: ({ row }) => {
        const serviceId = row.original
        const [showUpdateDrawer, setShowUpdateDrawer] = React.useState(false)
        const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
        const [isDeleting, setIsDeleting] = React.useState(false)
        const [deleteError, setDeleteError] = React.useState<string | null>(null)
        const { refetch: refetchServices } = useServiceIds()
        const [isRenewDrawerOpen, setIsRenewDrawerOpen] = React.useState(false)

        async function handleDelete() {
          setIsDeleting(true)
          setDeleteError(null)
          try {
            const res = await fetch(SERVICEID_DELETE_API(serviceId.svcid, serviceId.env), {
              method: 'DELETE',
            })
            if (!res.ok) throw new Error('Failed to delete Service ID')
            toast.success('Service ID deleted successfully')
            setIsDeleteDialogOpen(false)
            if (refetchServices) refetchServices()
          } catch (err) {
            setDeleteError('Failed to delete Service ID')
            toast.error('Failed to delete Service ID')
          } finally {
            setIsDeleting(false)
          }
        }

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={() => {
                  setSelectedServiceId(serviceId)
                  setShowDetailsModal(true)
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowUpdateDrawer(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Update
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsRenewDrawerOpen(true)}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Renew
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Service ID
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      Are you sure you want to delete this Service ID? This action cannot be undone.
                    </p>
                    <div className="rounded-md border p-4 bg-muted/30">
                      <div className="space-y-2">
                        <div className="grid grid-cols-[120px_1fr] gap-1">
                          <span className="text-sm font-medium">Service ID:</span>
                          <span className="text-sm font-semibold">{serviceId.svcid}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-1">
                          <span className="text-sm font-medium">Environment:</span>
                          <Badge variant="outline" className="w-fit">{serviceId.env}</Badge>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-1">
                          <span className="text-sm font-medium">Application:</span>
                          <span className="text-sm font-mono">{serviceId.application}</span>
                        </div>
                      </div>
                    </div>
                    {deleteError && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                        {deleteError}
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Service ID'
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Drawer open={showUpdateDrawer} onOpenChange={setShowUpdateDrawer} direction="right">
              <DrawerContent className="min-w-[750px] ml-auto h-full">
                <DrawerHeader className="border-b">
                  <DrawerTitle>Update Service ID</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto flex-1 h-[calc(100vh-4rem)]">
                  <div className="p-4">
                    <ServiceIdUpdateForm
                      serviceId={serviceId}
                      onSuccess={() => {
                        setShowUpdateDrawer(false)
                        if (refetchServices) refetchServices()
                      }}
                      onCancel={() => setShowUpdateDrawer(false)}
                    />
                  </div>
                </div>
                <DrawerClose />
              </DrawerContent>
            </Drawer>

            <ServiceIdRenewDrawer
              serviceId={serviceId}
              open={isRenewDrawerOpen}
              onOpenChange={setIsRenewDrawerOpen}
              onServiceIdRenewed={refetchServices}
            />
          </>
        )
      },
      enableSorting: false,
    },
  ]
}
