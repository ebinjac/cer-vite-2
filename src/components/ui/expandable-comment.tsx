import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { safeString } from '@/lib/table-utils'
import { HighlightedText } from './highlighted-text'

interface ExpandableCommentProps {
  comment: any
  globalFilter: string
}

export const ExpandableComment = React.memo(
  function ExpandableComment({ comment, globalFilter }: ExpandableCommentProps) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const safeComment = safeString(comment)
    const shouldTruncate = safeComment && safeComment.length > 100

    if (!safeComment) return <div className="text-muted-foreground italic">—</div>

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
    )
  }
)
