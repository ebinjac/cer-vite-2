'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  columnCategories,
  getFormattedColumnName,
  type AllColumnIds,
  type ColumnVisibilityState 
} from '../certificate-column-types'

interface ColumnVisibilityProps {
  columnVisibility: ColumnVisibilityState
  tempColumnVisibility: ColumnVisibilityState
  setTempColumnVisibility: React.Dispatch<React.SetStateAction<ColumnVisibilityState>>
  isColumnMenuOpen: boolean
  setIsColumnMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  applyColumnVisibility: () => void
}

export function ColumnVisibilityDropdown({
  columnVisibility,
  tempColumnVisibility,
  setTempColumnVisibility,
  isColumnMenuOpen,
  setIsColumnMenuOpen,
  applyColumnVisibility
}: ColumnVisibilityProps) {
  // Handle column visibility toggle
  const handleColumnVisibilityChange = React.useCallback((columnId: AllColumnIds, isVisible: boolean) => {
    setTempColumnVisibility(prev => {
      const newVisibility = { ...prev };
      newVisibility[columnId] = isVisible;
      return newVisibility;
    });
  }, [setTempColumnVisibility]);
  
  // View all columns
  const handleViewAll = React.useCallback(() => {
    const allColumns = Object.keys(tempColumnVisibility)
      .filter(col => col !== 'comment' && col !== 'actions') as AllColumnIds[];
      
    const newVisibility = Object.fromEntries(
      allColumns.map(id => [id, true])
    );
    
    // Preserve comment and actions visibility
    newVisibility.comment = tempColumnVisibility.comment;
    newVisibility.actions = true;
    
    setTempColumnVisibility(newVisibility as ColumnVisibilityState);
  }, [tempColumnVisibility, setTempColumnVisibility]);
  
  return (
    <DropdownMenu open={isColumnMenuOpen} onOpenChange={setIsColumnMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
        >
          Columns <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[280px]" 
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm leading-none">Show/Hide Columns</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleViewAll}
                >
                  View All
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={applyColumnVisibility}
                >
                  Apply
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-2">
              {/* Category-based column selection */}
              {Object.entries(columnCategories).map(([category, columnIds]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-sm font-medium capitalize">{category}</h5>
                  {columnIds.map((columnId) => {
                    if (columnId === 'actions') return null;
                    return (
                      <div key={columnId} className="flex items-center space-x-2">
                        <Checkbox
                          checked={tempColumnVisibility[columnId]}
                          onCheckedChange={(checked) => {
                            handleColumnVisibilityChange(columnId, !!checked);
                          }}
                          id={`column-${columnId}`}
                        />
                        <label
                          htmlFor={`column-${columnId}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {getFormattedColumnName(columnId)}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Comment column always at the end */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Additional</h5>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={tempColumnVisibility.comment}
                    onCheckedChange={(checked) => {
                      handleColumnVisibilityChange('comment', !!checked);
                    }}
                    id="column-comment"
                  />
                  <label
                    htmlFor="column-comment"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Comment
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 