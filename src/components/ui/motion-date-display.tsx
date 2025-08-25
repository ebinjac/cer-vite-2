import { motion } from 'framer-motion'
import { safeString } from '@/lib/table-utils'

interface MotionDateDisplayProps {
  shortDate: any
  longDate: any
}

export function MotionDateDisplay({ shortDate, longDate }: MotionDateDisplayProps) {
  const safeShortDate = safeString(shortDate)
  const safeLongDate = safeString(longDate)
  
  if (!safeShortDate) return <span className="text-muted-foreground italic">—</span>
  
  return (
    <motion.div 
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span 
        className="text-sm"
        initial={{ y: -5 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {safeShortDate}
      </motion.span>
      {safeLongDate && (
        <motion.span 
          className="text-xs text-muted-foreground"
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 0.8 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ opacity: 1 }}
        >
          {safeLongDate}
        </motion.span>
      )}
    </motion.div>
  )
}
