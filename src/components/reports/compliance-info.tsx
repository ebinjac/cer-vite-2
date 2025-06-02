import * as React from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { InfoIcon } from 'lucide-react'

export function ComplianceInfo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <InfoIcon className="h-4 w-4" />
          <span className="text-sm">How is compliance calculated?</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Compliance Score Calculation</h4>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Items are scored based on their expiration status:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>
                <span className="text-emerald-500 font-medium">Full compliance (1 point)</span>: More than 30 days until expiration
              </li>
              <li>
                <span className="text-amber-500 font-medium">Partial compliance (0.5 points)</span>: 30 days or less until expiration
              </li>
              <li>
                <span className="text-destructive font-medium">Non-compliant (0 points)</span>: Already expired
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Final score = (Total points / Total items) × 100
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
} 