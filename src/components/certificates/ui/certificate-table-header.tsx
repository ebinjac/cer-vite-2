'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { CertificateFilters } from './certificate-filters'
import { ColumnVisibilityDropdown } from './certificate-column-visibility'
import { downloadTableAsCSV } from '../utils/certificate-utils'
import { type Table } from '@tanstack/react-table'
import { type CertificateCustomStatus } from '@/hooks/use-certificates'
import type { Certificate } from '@/hooks/use-certificates'
import type { ColumnVisibilityState } from '../certificate-column-types'

interface CertificateTableHeaderProps {
  table: Table<Certificate>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  statusFilter: CertificateCustomStatus[]
  expirationFilter: string[]
  availableCustomStatuses: CertificateCustomStatus[]
  handleStatusFilterChange: (status: CertificateCustomStatus, checked: boolean) => void
  handleExpirationFilterChange: (value: string, checked: boolean) => void
  clearFilters: () => void
  columnVisibility: ColumnVisibilityState
  tempColumnVisibility: ColumnVisibilityState
  setTempColumnVisibility: React.Dispatch<React.SetStateAction<ColumnVisibilityState>>
  isColumnMenuOpen: boolean
  setIsColumnMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  applyColumnVisibility: () => void
  teamName?: string
}

export function CertificateTableHeader({
  table,
  globalFilter,
  setGlobalFilter,
  statusFilter,
  expirationFilter,
  availableCustomStatuses,
  handleStatusFilterChange,
  handleExpirationFilterChange,
  clearFilters,
  columnVisibility,
  tempColumnVisibility,
  setTempColumnVisibility,
  isColumnMenuOpen,
  setIsColumnMenuOpen,
  applyColumnVisibility,
  teamName
}: CertificateTableHeaderProps) {
  return (
    <div className="pb-0">
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
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => downloadTableAsCSV(
                table.getFilteredRowModel().rows.map(row => row.original), 
                table.getVisibleLeafColumns().map(col => col.id)
              )}
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
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="default" size="sm">
              Add Certificate
            </Button>
          </motion.div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
        <CertificateFilters 
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          statusFilter={statusFilter}
          expirationFilter={expirationFilter}
          availableCustomStatuses={availableCustomStatuses}
          handleStatusFilterChange={handleStatusFilterChange}
          handleExpirationFilterChange={handleExpirationFilterChange}
          clearFilters={clearFilters}
        />
        <div className="flex flex-wrap items-center gap-2">
          <ColumnVisibilityDropdown 
            columnVisibility={columnVisibility}
            tempColumnVisibility={tempColumnVisibility}
            setTempColumnVisibility={setTempColumnVisibility}
            isColumnMenuOpen={isColumnMenuOpen}
            setIsColumnMenuOpen={setIsColumnMenuOpen}
            applyColumnVisibility={applyColumnVisibility}
          />
        </div>
      </div>
    </div>
  )
} 