'use client'

import * as React from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  tooltipMessage?: string
  onCopied?: () => void
  className?: string
}

export function CopyButton({
  value,
  tooltipMessage = 'Copy to clipboard',
  onCopied,
  className,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [hasCopied])

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-7 w-7 text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:bg-zinc-800",
              className
            )}
            onClick={async () => {
              await navigator.clipboard.writeText(value)
              setHasCopied(true)
              if (onCopied) {
                onCopied()
              }
            }}
            {...props}
          >
            <span className="sr-only">Copy {tooltipMessage}</span>
            {hasCopied ? (
              <CheckIcon className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {hasCopied ? 'Copied!' : tooltipMessage}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 