'use client'

import * as React from 'react'
import { ChevronDown, X, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type CertificateCustomStatus } from '@/hooks/use-certificates'
import { customStatusIcons } from '@/hooks/use-certificates'
import { expirationFilterOptions } from '../certificate-column-types'

interface CertificateFiltersProps {
  globalFilter: string
  setGlobalFilter: (value: string) => void
  statusFilter: CertificateCustomStatus[]
  expirationFilter: string[]
  availableCustomStatuses: CertificateCustomStatus[]
  handleStatusFilterChange: (status: CertificateCustomStatus, checked: boolean) => void
  handleExpirationFilterChange: (value: string, checked: boolean) => void
  clearFilters: () => void
  className?: string
}

export function CertificateFilters({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  expirationFilter,
  availableCustomStatuses,
  handleStatusFilterChange,
  handleExpirationFilterChange,
  clearFilters,
  className
}: CertificateFiltersProps) {
  const hasActiveFilters = globalFilter || statusFilter.length > 0 || expirationFilter.length > 0
  
  return (
    <div className={`flex flex-col sm:flex-row gap-4 justify-between ${className}`}>
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 pr-10"
          />
          <AnimatePresence>
            {globalFilter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-1 top-1.5 h-7 w-7 p-0"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Expiration filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
            >
              Expiration {expirationFilter.length > 0 && `(${expirationFilter.length})`}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {expirationFilterOptions.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={expirationFilter.includes(value)}
                onCheckedChange={(checked) => {
                  handleExpirationFilterChange(value, !!checked)
                }}
              >
                <div className="flex items-center gap-2">
                  {label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            {expirationFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleExpirationFilterChange("", false)}
                  className="justify-center text-center text-sm text-muted-foreground"
                >
                  Clear expiration filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
            >
              Status {statusFilter.length > 0 && `(${statusFilter.length})`}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {availableCustomStatuses.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(value) => {
                  handleStatusFilterChange(status, !!value)
                }}
              >
                <div className="flex items-center gap-2">
                  {customStatusIcons[status] && (
                    <span className="mr-1">{customStatusIcons[status]}</span>
                  )}
                  {status}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange("" as any, false)}
                  className="justify-center text-center text-sm text-muted-foreground"
                >
                  Clear status filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters button */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 