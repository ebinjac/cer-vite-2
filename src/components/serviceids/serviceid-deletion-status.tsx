import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface DeletionResult {
  svcid: string
  success: boolean
  error?: string
  statusCode?: number
}

interface ServiceIdDeletionStatusProps {
  results: DeletionResult[]
  isCompleted: boolean
  inProgress: boolean
  currentIndex: number
  totalCount: number
}

export function ServiceIdDeletionStatus({
  results,
  isCompleted,
  inProgress,
  currentIndex,
  totalCount
}: ServiceIdDeletionStatusProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  
  // Calculate success/failure stats
  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length
  const completedCount = successCount + failureCount
  const progressPercentage = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0
  
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  }
  
  // Get status summary text
  const getStatusSummary = () => {
    if (inProgress) {
      return `Deleting service IDs... (${currentIndex}/${totalCount})`
    }
    
    if (isCompleted) {
      if (successCount === totalCount) {
        return 'All service IDs deleted successfully'
      } else if (successCount > 0 && failureCount > 0) {
        return `Completed with issues: ${successCount} succeeded, ${failureCount} failed`
      } else if (failureCount === totalCount) {
        return 'Failed to delete service IDs'
      }
    }
    
    return 'Ready to delete service IDs'
  }
  
  // Get status color
  const getStatusColor = () => {
    if (inProgress) return 'bg-blue-500'
    if (isCompleted) {
      if (successCount === totalCount) return 'bg-green-500'
      if (failureCount === totalCount) return 'bg-destructive'
      return 'bg-amber-500' // Partial success
    }
    return 'bg-slate-300'
  }
  
  return (
    <div className="space-y-4">
      {/* Status summary section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              successCount === totalCount ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : failureCount === totalCount ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )
            ) : (
              <motion.div 
                className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <span className="font-medium">{getStatusSummary()}</span>
          </div>
          
          {results.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="p-0 h-8 text-xs"
            >
              {showDetails ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <motion.div 
            className={`h-2.5 rounded-full ${getStatusColor()}`}
            style={{ width: `${progressPercentage}%` }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Status badges */}
        {completedCount > 0 && (
          <div className="flex gap-2 items-center text-sm">
            {successCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                {successCount} Successful
              </Badge>
            )}
            {failureCount > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                {failureCount} Failed
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Detailed results */}
      <AnimatePresence>
        {showDetails && results.length > 0 && (
          <motion.div
            className="border rounded-md overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeIn}
          >
            <ScrollArea className="h-[200px]">
              <div className="p-2 space-y-1">
                {results.map((result, index) => (
                  <div 
                    key={`${result.svcid}-${index}`}
                    className={`p-2 rounded-md text-sm flex items-start justify-between ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{result.svcid}</div>
                        {!result.success && result.error && (
                          <div className="text-xs text-red-600 mt-1">{result.error}</div>
                        )}
                      </div>
                    </div>
                    {result.statusCode && (
                      <Badge variant="outline" className="bg-slate-100 text-slate-800">
                        Status: {result.statusCode}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}