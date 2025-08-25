import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import { MotionButton } from './motion-components'
import { cn } from '@/lib/utils'

interface AnimatedColumnHeaderProps {
  column: any
  children: React.ReactNode
  className?: string
}

export function AnimatedColumnHeader({ column, children, className }: AnimatedColumnHeaderProps) {
  return (
    <MotionButton
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn("px-0 hover:bg-transparent", className)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
      <motion.span 
        animate={{ 
          rotate: column.getIsSorted() ? (column.getIsSorted() === "asc" ? 0 : 180) : 0,
          opacity: column.getIsSorted() ? 1 : 0.5
        }}
        transition={{ duration: 0.2 }}
      >
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </motion.span>
    </MotionButton>
  )
}
