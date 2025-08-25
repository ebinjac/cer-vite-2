import * as React from 'react'
import { safeString } from '@/lib/table-utils'

interface HighlightedTextProps {
  text: any
  highlight: string
}

export const HighlightedText = React.memo(
  function HighlightedText({ text, highlight }: HighlightedTextProps) {
    const safeText = safeString(text)
    const safeHighlight = safeString(highlight).trim()
    
    if (!safeHighlight || !safeText) return <span>{safeText}</span>
    
    try {
      const regex = new RegExp(`(${safeHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      const parts = safeText.split(regex)
      
      return (
        <span>
          {parts.map((part, i) => 
            regex.test(part) ? (
              <span key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
      )
    } catch (error) {
      return <span>{safeText}</span>
    }
  },
  (prevProps, nextProps) => 
    prevProps.text === nextProps.text && 
    prevProps.highlight === nextProps.highlight
)
