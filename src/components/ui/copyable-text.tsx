import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { safeString } from '@/lib/table-utils'

interface CopyableTextProps {
  text: any
  fieldName: string
  className?: string
}

export function CopyableText({ text, fieldName, className }: CopyableTextProps) {
  const [copied, setCopied] = React.useState(false)
  const safeText = safeString(text)
  
  const handleCopy = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row selection when copying
    
    navigator.clipboard.writeText(safeText).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      (err) => {
        console.error('Could not copy text: ', err)
      }
    )
  }, [safeText])
  
  if (!safeText) return <span className="text-muted-foreground italic">—</span>
  
  return (
    <motion.div 
      className={cn(
        "group relative cursor-pointer flex items-start gap-1",
        className
      )} 
      onClick={handleCopy}
      title={`Click to copy ${fieldName}`}
      whileTap={{ scale: 0.97 }}
      whileHover={{ 
        backgroundColor: "rgba(0, 0, 0, 0.03)", 
        borderRadius: "4px",
        paddingLeft: "4px",
        paddingRight: "4px",
      }}
    >
      <span className="break-words">{safeText}</span>
      <AnimatePresence>
        {copied ? (
          <motion.span 
            className="text-green-500 ml-1 flex-shrink-0 mt-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.span>
        ) : (
          <motion.span 
            className="text-muted-foreground ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
