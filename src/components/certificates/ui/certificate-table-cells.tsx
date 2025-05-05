'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  formatDate,
  formatDateLong,
  safeString,
  getDaysUntilExpiration,
  getCertificateCustomStatus
} from '../utils/certificate-utils'
import { customStatusColors, customStatusIcons } from '@/hooks/use-certificates'

// Animation variants
const statusBadgeVariants = {
  initial: { scale: 0.95 },
  animate: { scale: 1, transition: { duration: 0.2 } },
  hover: { scale: 1.03, transition: { duration: 0.2 } }
}

/**
 * Highlighted text component for search matches
 */
export const HighlightedText = React.memo(
  function HighlightedText({ text, highlight }: { text: any, highlight: string }) {
    // Safely convert text to string
    const safeText = safeString(text);
    const safeHighlight = safeString(highlight).trim();
    
    if (!safeHighlight || !safeText) return <span>{safeText}</span>;
    
    try {
      const regex = new RegExp(`(${safeHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = safeText.split(regex);
      
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
      );
    } catch (error) {
      // Fallback if regex fails
      return <span>{safeText}</span>;
    }
  },
  (prevProps, nextProps) => 
    prevProps.text === nextProps.text && 
    prevProps.highlight === nextProps.highlight
);

/**
 * Copyable text component with animation
 */
export function CopyableText({ text, fieldName, className }: { 
  text: any; 
  fieldName: string; 
  className?: string 
}) {
  const [copied, setCopied] = React.useState(false);
  const safeText = safeString(text);
  
  const handleCopy = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection when copying
    
    navigator.clipboard.writeText(safeText).then(
      () => {
        // Show visual feedback directly in the component
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  }, [safeText]);
  
  if (!safeText) return <span className="text-muted-foreground italic">—</span>;
  
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
  );
}

/**
 * Status badge component with animation
 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Badge 
        variant="outline" 
        className={customStatusColors[status as keyof typeof customStatusColors]}
      >
        {customStatusIcons[status as keyof typeof customStatusIcons] && (
          <span className="mr-1">{customStatusIcons[status as keyof typeof customStatusIcons]}</span>
        )}
        {status}
      </Badge>
    </motion.div>
  );
}

/**
 * Days left component with animation for expiration
 */
export function DaysLeftCell({ days }: { days: number | null }) {
  if (days === null) return <div className="text-muted-foreground italic">—</div>;
  
  // Define color based on days left
  const textColor = days === 0 
    ? "text-destructive" 
    : days <= 30 
      ? "text-amber-600" 
      : "text-green-600";
  
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
          Expired
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
  );
}

/**
 * Formatted date display component with animation
 */
export function DateDisplayCell({ dateString, showLong = true }: { 
  dateString: string; 
  showLong?: boolean 
}) {
  const safeShortDate = formatDate(dateString);
  const safeLongDate = showLong ? formatDateLong(dateString) : '';
  
  if (!safeShortDate) return <span className="text-muted-foreground italic">—</span>;
  
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
  );
}

/**
 * Expandable comment component
 */
export const ExpandableComment = React.memo(
  function ExpandableComment({ comment, globalFilter }: { comment: any, globalFilter: string }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const safeComment = safeString(comment);
    const shouldTruncate = safeComment && safeComment.length > 100;

    if (!safeComment) return <div className="text-muted-foreground italic">—</div>;

    return (
      <div className="max-w-[400px]">
        <div
          className={cn(
            "relative",
            !isExpanded && shouldTruncate && "max-h-[2.5em] overflow-hidden"
          )}
        >
          {globalFilter ? (
            <HighlightedText text={safeComment} highlight={globalFilter} />
          ) : (
            <span>{safeComment}</span>
          )}
        </div>
        {shouldTruncate && (
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => 
    prevProps.comment === nextProps.comment &&
    prevProps.globalFilter === nextProps.globalFilter
);

/**
 * Boolean cell component (Yes/No)
 */
export function BooleanCell({ value }: { value: string | boolean }) {
  const boolValue = value === 'true' || value === true;
  return <div>{boolValue ? 'Yes' : 'No'}</div>;
}

/**
 * Link cell component for URIs
 */
export function LinkCell({ uri, globalFilter }: { uri: string, globalFilter: string }) {
  if (!uri) return null;
  
  const displayUri = uri.replace(/^https?:\/\//, '').substring(0, 25) + 
    (uri.replace(/^https?:\/\//, '').length > 25 ? '...' : '');
  
  return (
    <a 
      href={uri} 
      target="_blank" 
      rel="noreferrer" 
      className="text-blue-600 hover:underline hover:text-blue-800"
    >
      {globalFilter ? <HighlightedText text={displayUri} highlight={globalFilter} /> : displayUri}
    </a>
  );
} 