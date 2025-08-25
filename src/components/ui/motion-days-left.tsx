import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MotionDaysLeftProps {
  days: number | null
  expiredText?: string
}

export function MotionDaysLeft({ days, expiredText = "Expired" }: MotionDaysLeftProps) {
  if (days === null) return <div className="text-muted-foreground italic">—</div>
  
  // Define color based on days left
  const textColor = days === 0 
    ? "text-destructive" 
    : days <= 30 
      ? "text-amber-600" 
      : "text-green-600"
  
  return (
    <motion.div 
      className={cn("font-medium flex items-center gap-1", textColor)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {days === 0 ? (
        <motion.span
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {expiredText}
        </motion.span>
      ) : (
        <>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.1 }
            }}
            className="font-bold"
          >
            {days}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.2 }
            }}
          >
            days
          </motion.span>
          
          {/* Visual indicator for urgency */}
          {days <= 30 && (
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full ml-1",
                days <= 7 ? "bg-destructive" : "bg-amber-500"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 10,
                delay: 0.3
              }}
            />
          )}
        </>
      )}
    </motion.div>
  )
}
