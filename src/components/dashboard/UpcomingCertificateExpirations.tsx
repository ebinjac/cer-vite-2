import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface UpcomingCertificateExpirationsProps {
  items: { cn: string; days: number | null }[]
  className?: string
}

export function UpcomingCertificateExpirations({ items, className = '' }: UpcomingCertificateExpirationsProps) {
  return (
    <Card className={className + ' flex flex-col'}>
      <CardContent className="flex-1 overflow-y-auto p-4">
        <h3 className="text-base font-semibold mb-3">Upcoming Certificate Expirations</h3>
        <div className="flex flex-col gap-2">
          {items.length === 0 && (
            <div className="text-muted-foreground text-sm">No upcoming expirations</div>
          )}
          {items.map((item, idx) => (
            <div key={item.cn + idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <span className="truncate max-w-[60%] font-medium text-sm">{item.cn}</span>
              <Badge
                variant="outline"
                className={
                  item.days === null || isNaN(item.days)
                    ? 'bg-gray-100 text-gray-500 border-gray-300'
                    : item.days < 0
                    ? 'bg-red-100 text-red-700 border-red-300 font-semibold'
                    : item.days <= 7
                    ? 'bg-red-100 text-red-700 border-red-300 font-semibold'
                    : item.days <= 30
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-green-100 text-green-800 border-green-300'
                }
              >
                {item.days === null || isNaN(item.days)
                  ? 'NaN days'
                  : `${item.days < 0 ? '' : '+'}${item.days} days`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 