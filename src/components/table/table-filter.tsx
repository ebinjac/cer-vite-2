import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MotionButton } from '@/components/ui/motion-components'

interface FilterOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface TableFilterProps {
  title: string
  options: FilterOption[]
  selectedValues: string[]
  onFilterChange: (value: string, checked: boolean) => void
  onClearFilter: () => void
}

export function TableFilter({ 
  title, 
  options, 
  selectedValues, 
  onFilterChange, 
  onClearFilter 
}: TableFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MotionButton 
          variant="outline" 
          size="sm" 
          className="h-8"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {title} {selectedValues.length > 0 && `(${selectedValues.length})`}
          <ChevronDown className="ml-1 h-3 w-3" />
        </MotionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {options.map(({ value, label, icon }) => (
          <DropdownMenuCheckboxItem
            key={value}
            checked={selectedValues.includes(value)}
            onCheckedChange={(checked) => {
              onFilterChange(value, !!checked)
            }}
          >
            <div className="flex items-center gap-2">
              {icon && <span className="mr-1">{icon}</span>}
              {label}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
        {selectedValues.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onClearFilter}
              className="justify-center text-center text-sm text-muted-foreground"
            >
              Clear {title.toLowerCase()} filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
