import { useState } from 'react'

export function useColumnVisibility<T extends Record<string, boolean>>(initialVisibility: T) {
  const [columnVisibility, setColumnVisibility] = useState<T>(initialVisibility)
  const [tempColumnVisibility, setTempColumnVisibility] = useState<T>(initialVisibility)
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)

  const handleColumnVisibilityChange = (columnId: keyof T, isVisible: boolean) => {
    setTempColumnVisibility(prev => ({
      ...prev,
      [columnId]: isVisible
    }))
  }

  const applyColumnVisibility = () => {
    try {
      // Always ensure comment column is last if it exists
      const newVisibility = { ...tempColumnVisibility }
      const commentVisible = newVisibility.comment
      
      // Create new object without comment
      const { comment: _, ...restVisibility } = newVisibility
      
      // Add comment back at the end if it was visible
      const finalVisibility: T = {
        ...restVisibility,
        ...(commentVisible !== undefined ? { comment: commentVisible } : {})
      } as T
      
      setColumnVisibility(finalVisibility)
      setIsColumnMenuOpen(false)
    } catch (error) {
      console.error("Error applying column visibility:", error)
      setIsColumnMenuOpen(false)
    }
  }

  return {
    columnVisibility,
    tempColumnVisibility,
    isColumnMenuOpen,
    setColumnVisibility,
    setTempColumnVisibility,
    setIsColumnMenuOpen,
    handleColumnVisibilityChange,
    applyColumnVisibility
  }
}
