import { AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MotionButton } from '@/components/ui/motion-components'

interface TableSearchProps {
  globalFilter: string
  setGlobalFilter: (value: string) => void
  placeholder?: string
}

export function TableSearch({ globalFilter, setGlobalFilter, placeholder = "Search..." }: TableSearchProps) {
  return (
    <div className="flex-1 max-w-md relative">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 pr-10"
        />
        <AnimatePresence>
          {globalFilter && (
            <MotionButton
              variant="ghost"
              size="sm"
              onClick={() => setGlobalFilter("")}
              className="absolute right-1 top-1.5 h-7 w-7 p-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </MotionButton>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
