// components/certificates/certificate-columns.tsx

import * as React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, RefreshCw, History, MoreVertical, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { Certificate } from '@/hooks/use-certificates'
import { 
  getStatusColor,
  getStatusIcons,
  getCertificateCustomStatus as originalGetCertificateCustomStatus,
  getDaysUntilExpiration as originalGetDaysUntilExpiration,
} from '@/hooks/use-certificates'
import { MotionBadge } from '@/components/ui/motion-components'
import { AnimatedColumnHeader } from '@/components/ui/animated-column-header'
import { MotionCheckbox } from '@/components/ui/motion-checkbox'
import { CopyableText } from '@/components/ui/copyable-text'
import { HighlightedText } from '@/components/ui/highlighted-text'
import { MotionDateDisplay } from '@/components/ui/motion-date-display'
import { MotionDaysLeft } from '@/components/ui/motion-days-left'
import { ExpandableComment } from '@/components/ui/expandable-comment'
import { CertificateDetailsModal } from './certificate-details-modal'
import { formatDate, formatDateLong, statusBadgeVariants } from '@/lib/table-utils'

// Helper functions with safety checks
function getDaysUntilExpiration(validTo: any): number | null {
  try {
    return originalGetDaysUntilExpiration(validTo)
  } catch (error) {
    return null
  }
}

function getCertificateCustomStatus(validTo: any) {
  try {
    return originalGetCertificateCustomStatus(validTo)
  } catch (error) {
    return 'Expired'
  }
}

export function CertificateColumns(
  globalFilter: string,
  setSelectedCertificate: (cert: Certificate) => void,
  setUpdateDrawerOpen: (open: boolean) => void,
  setRenewDrawerOpen: (open: boolean) => void,
  setDeleteDialogOpen: (open: boolean) => void,
  onCertificateAdded?: () => void
): ColumnDef<Certificate>[] {
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
    
    // Common Name
    {
      accessorKey: 'commonName',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column} className="p-0 h-auto font-medium">
          Common Name
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const value = row.getValue('commonName') as string
        return (
          <div 
            className="font-medium overflow-hidden text-ellipsis min-w-[150px] break-words" 
            title={value}
          >
            {globalFilter ? (
              <HighlightedText text={value} highlight={globalFilter} />
            ) : (
              <CopyableText text={value} fieldName="Common Name" />
            )}
          </div>
        )
      },
      enableSorting: true,
    },
    
    // Serial Number
    {
      accessorKey: 'serialNumber',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column} className="p-0 h-auto font-medium">
          Serial Number
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const serial = row.getValue('serialNumber') as string
        return (
          <div className="font-mono text-xs">
            {globalFilter ? (
              <HighlightedText text={serial} highlight={globalFilter} />
            ) : (
              <CopyableText text={serial} fieldName="Serial Number" className="font-mono text-xs" />
            )}
          </div>
        )
      },
      enableSorting: true,
    },
    
    // Custom Status
    {
      id: 'customStatus',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Status
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validTo = row.original.validTo as string
        const status = getCertificateCustomStatus(validTo)
        return (
          <div className="flex items-center gap-2">
            <MotionBadge 
              variant="outline" 
              className={getStatusColor[status]}
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={statusBadgeVariants}
            >
              {getStatusIcons[status] && (
                <span className="mr-1">{getStatusIcons[status]}</span>
              )}
              {status}
            </MotionBadge>
          </div>
        )
      },
      accessorFn: (row) => {
        const validTo = row.validTo
        const status = getCertificateCustomStatus(validTo)
        const statusOrder = { 'Valid': 0, 'Expiring Soon': 1, 'Expired': 2 }
        return statusOrder[status]
      },
      enableSorting: true,
    },
    
    // Valid From
    {
      accessorKey: 'validFrom',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Valid From
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validFrom = row.getValue('validFrom') as string
        return <MotionDateDisplay shortDate={formatDate(validFrom)} longDate={formatDateLong(validFrom)} />
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('validFrom'))
        const dateB = new Date(rowB.getValue('validFrom'))
        return dateA.getTime() - dateB.getTime()
      },
    },
    
    // Valid To
    {
      accessorKey: 'validTo',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Valid To
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validTo = row.getValue('validTo') as string
        return <MotionDateDisplay shortDate={formatDate(validTo)} longDate={formatDateLong(validTo)} />
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('validTo'))
        const dateB = new Date(rowB.getValue('validTo'))
        return dateA.getTime() - dateB.getTime()
      },
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
        const validTo = row.getValue('validTo') as string
        const daysUntil = getDaysUntilExpiration(validTo)
        return <MotionDaysLeft days={daysUntil} />
      },
      accessorFn: (row) => {
        const validTo = row.validTo
        if (!validTo) return Infinity
        
        const validToDate = new Date(validTo)
        const today = new Date()
        
        validToDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        
        const diffTime = validToDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return diffDays > 0 ? diffDays : 0
      },
      enableSorting: true,
    },
    
    // Application Name
    {
      accessorKey: 'applicationName',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Application
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const app = row.getValue('applicationName') as string
        return <div>{globalFilter ? <HighlightedText text={app} highlight={globalFilter} /> : app}</div>
      },
      enableSorting: true,
    },
    
    // Zero Touch
    {
      accessorKey: 'zeroTouch',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Zero Touch
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4"/><path d="m7 20V4"/><path d="m21 8-4-4-4 4"/><path d="m17 4v16"/></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const zeroTouch = row.getValue('zeroTouch') as string
        return <div>{zeroTouch === 'true' ? 'Yes' : 'No'}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const valueA = rowA.getValue('zeroTouch') === 'true' ? 1 : 0
        const valueB = rowB.getValue('zeroTouch') === 'true' ? 1 : 0
        return valueA - valueB
      },
    },
    
    // Hosting Team Name
    {
      accessorKey: 'hostingTeamName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Hosting Team
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4"/><path d="m7 20V4"/><path d="m21 8-4-4-4 4"/><path d="m17 4v16"/></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const team = row.getValue('hostingTeamName') as string
        return <div>{globalFilter ? <HighlightedText text={team} highlight={globalFilter} /> : team}</div>
      },
      enableSorting: true,
    },
    
    // Certificate Purpose
    {
      accessorKey: 'certificatePurpose',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Purpose
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4"/><path d="m7 20V4"/><path d="m21 8-4-4-4 4"/><path d="m17 4v16"/></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const purpose = row.getValue('certificatePurpose') as string
        return <div>{globalFilter ? <HighlightedText text={purpose} highlight={globalFilter} /> : purpose}</div>
      },
      enableSorting: true,
    },
    
    // Certificate Status
    {
      accessorKey: 'certificateStatus',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Certificate Status
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4"/><path d="m7 20V4"/><path d="m21 8-4-4-4 4"/><path d="m17 4v16"/></svg>
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.certificateStatus as string
        return (
          <div className="flex items-center gap-2">
            <MotionBadge 
              variant="outline" 
              className={getStatusColor[status as keyof typeof getStatusColor]}
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={statusBadgeVariants}
            >
              {getStatusIcons[status as keyof typeof getStatusIcons] && (
                <span className="mr-1">{getStatusIcons[status as keyof typeof getStatusIcons]}</span>
              )}
              {status}
            </MotionBadge>
          </div>
        )
      },
      accessorFn: (row) => {
        const status = row.certificateStatus as string
        const statusOrder: Record<string, number> = { 
          'Issued': 0, 
          'Pending': 1, 
          'Expiring Soon': 2,
          'Expired': 3,
          'Revoked': 4
        }
        return statusOrder[status] !== undefined ? statusOrder[status] : 999
      },
      enableSorting: true,
    },
    {
      accessorKey: 'certificateIdentifier',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Certificate Identifier
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue('certificateIdentifier') as string
        return <div className="font-mono text-xs truncate max-w-[180px]">
          {globalFilter ? <HighlightedText text={id} highlight={globalFilter} /> : id}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'currentCert',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Current Cert
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const current = row.getValue('currentCert') as string
        return <div>{current === 'true' ? 'Yes' : 'No'}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const valueA = rowA.getValue('currentCert') === 'true' ? 1 : 0;
        const valueB = rowB.getValue('currentCert') === 'true' ? 1 : 0;
        return valueA - valueB;
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
    {
      accessorKey: 'subjectAlternateNames',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Subject Alternate Names
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const sans = row.getValue('subjectAlternateNames') as string
        return <div className="truncate max-w-[180px]">
          {globalFilter ? <HighlightedText text={sans} highlight={globalFilter} /> : sans}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'issuerCertAuthName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Issuer
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const issuer = row.getValue('issuerCertAuthName') as string
        return <div>{globalFilter ? <HighlightedText text={issuer} highlight={globalFilter} /> : issuer}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'idaasIntegrationId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          IDaaS Integration ID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue('idaasIntegrationId') as string
        return <div className="font-mono text-xs truncate max-w-[180px]">
          {globalFilter ? <HighlightedText text={id} highlight={globalFilter} /> : id}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'isAmexCert',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Is Amex Cert
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const isAmex = row.getValue('isAmexCert') as string
        return <div>{isAmex}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'certType',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Certificate Type
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const certType = row.getValue('certType') as string
        return <div>{globalFilter ? <HighlightedText text={certType} highlight={globalFilter} /> : certType}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'acknowledgedBy',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Acknowledged By
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue('acknowledgedBy') as string
        return <div>{globalFilter ? <HighlightedText text={name} highlight={globalFilter} /> : name}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'centralID',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Central ID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue('centralID') as string
        return <div>{globalFilter ? <HighlightedText text={id} highlight={globalFilter} /> : id}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'lastNotification',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Last Notification
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const notification = row.getValue('lastNotification') as number
        return <div>{notification || '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'lastNotificationOn',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Last Notification On
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('lastNotificationOn') as string
        const formattedDate = date ? formatDate(date) : '-'
        return <div>{globalFilter && date ? <HighlightedText text={formattedDate} highlight={globalFilter} /> : formattedDate}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.getValue('lastNotificationOn') ? new Date(rowA.getValue('lastNotificationOn')) : new Date(0);
        const dateB = rowB.getValue('lastNotificationOn') ? new Date(rowB.getValue('lastNotificationOn')) : new Date(0);
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
          Renewing Team
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const team = row.getValue('renewingTeamName') as string
        return <div>{globalFilter ? <HighlightedText text={team} highlight={globalFilter} /> : team}</div>
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
        const changeNumber = row.getValue('changeNumber') as string
        return <div>{globalFilter ? <HighlightedText text={changeNumber} highlight={globalFilter} /> : changeNumber}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'serverName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Server
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const server = row.getValue('serverName') as string
        return <div>{globalFilter ? <HighlightedText text={server} highlight={globalFilter} /> : server}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'keystorePath',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Keystore Path
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const path = row.getValue('keystorePath') as string
        return <div className="font-mono text-xs">
          {globalFilter ? <HighlightedText text={path} highlight={globalFilter} /> : path}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'uri',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          URI
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3"><path d="m3 16 4 4 4-4"/><path d="m7 20V4"/><path d="m21 8-4-4-4 4"/><path d="m17 4v16"/></svg>
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
        const certificate = row.original
        const [showDetails, setShowDetails] = React.useState(false)

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
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedCertificate(certificate)
                  setUpdateDrawerOpen(true)
                }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Update
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedCertificate(certificate)
                  setRenewDrawerOpen(true)
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renew
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <History className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setSelectedCertificate(certificate)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CertificateDetailsModal 
              certificate={certificate}
              open={showDetails}
              onOpenChange={setShowDetails}
            />
          </>
        )
      },
      enableSorting: false,
    },
  ]
}
