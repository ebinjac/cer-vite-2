import { useState, useMemo } from 'react'

export interface FilterState<T = string> {
  statusFilter: T[]
  expirationFilter: string[]
  globalFilter: string
}

export function useTableFilters<T = string>() {
  const [statusFilter, setStatusFilter] = useState<T[]>([])
  const [expirationFilter, setExpirationFilter] = useState<string[]>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const hasActiveFilters = useMemo(() => 
    globalFilter || statusFilter.length > 0 || expirationFilter.length > 0,
    [globalFilter, statusFilter.length, expirationFilter.length]
  )

  const clearFilters = () => {
    setStatusFilter([])
    setExpirationFilter([])
    setGlobalFilter("")
  }

  const handleStatusFilterChange = (status: T, checked: boolean) => {
    if (checked) {
      setStatusFilter(prev => [...prev, status])
    } else {
      setStatusFilter(prev => prev.filter(s => s !== status))
    }
  }

  const handleExpirationFilterChange = (value: string, checked: boolean) => {
    if (checked) {
      setExpirationFilter(prev => [...prev, value])
    } else {
      setExpirationFilter(prev => prev.filter(v => v !== value))
    }
  }

  return {
    statusFilter,
    expirationFilter,
    globalFilter,
    hasActiveFilters,
    setGlobalFilter,
    clearFilters,
    handleStatusFilterChange,
    handleExpirationFilterChange
  }
}
