import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface UpcomingCertificateExpirationsProps {
  items: { cn: string; days: number | null }[]
  className?: string
  type?: 'certificate' | 'service-id'
}

export function UpcomingCertificateExpirations({ 
  items, 
  className = '',
  type = 'certificate'
}: UpcomingCertificateExpirationsProps) {
  // Count certificates by status
  const stats = items.reduce((acc, item) => {
    if (item.days === null || isNaN(item.days)) acc.invalid++;
    else if (item.days < 0) acc.expired++;
    else if (item.days <= 7) acc.critical++;
    else if (item.days <= 30) acc.warning++;
    else acc.healthy++;
    return acc;
  }, { expired: 0, critical: 0, warning: 0, healthy: 0, invalid: 0 });

  // Get status icon and style for a certificate
  const getStatusInfo = (days: number | null) => {
    if (days === null || isNaN(days)) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        className: 'bg-muted text-muted-foreground border-border',
        iconClass: 'text-muted-foreground',
        label: 'Invalid'
      };
    }
    if (days < 0) {
      return {
        icon: <XCircle className="h-4 w-4" />,
        className: 'bg-destructive/10 text-destructive border-destructive/20 font-semibold',
        iconClass: 'text-destructive',
        label: 'Expired'
      };
    }
    if (days <= 7) {
      return {
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-destructive/10 text-destructive border-destructive/20 font-semibold',
        iconClass: 'text-destructive',
        label: 'Critical'
      };
    }
    if (days <= 30) {
      return {
        icon: <Clock className="h-4 w-4" />,
        className: 'bg-primary/10 text-primary border-primary/20',
        iconClass: 'text-primary',
        label: 'Warning'
      };
    }
    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      className: 'bg-secondary text-secondary-foreground border-secondary/50',
      iconClass: 'text-secondary-foreground',
      label: type === 'certificate' ? 'Healthy' : 'Compliant'
    };
  };

  return (
    <Card className={className + ' flex flex-col'}>
      <CardHeader className="pb-1 space-y-1">
        <CardTitle className=" text-sm font-medium flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Upcoming {type === 'certificate' ? 'Certificate' : 'Service ID'} Expirations
        </CardTitle>
        <CardDescription className="flex gap-2 flex-wrap text-xs">
          {stats.expired > 0 && (
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-1.5 py-0">
                {stats.expired} expired
              </Badge>
            </span>
          )}
          {stats.critical > 0 && (
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-1.5 py-0">
                {stats.critical} critical
              </Badge>
            </span>
          )}
          {stats.warning > 0 && (
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-1.5 py-0">
                {stats.warning} warning
              </Badge>
            </span>
          )}
          {stats.healthy > 0 && (
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-secondary text-secondary-foreground border-secondary/50 text-xs px-1.5 py-0">
                {stats.healthy} {type === 'certificate' ? 'healthy' : 'compliant'}
              </Badge>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[300px] pr-4">
          <div className="flex flex-col gap-1.5">
            {items.length === 0 && (
              <div className="text-muted-foreground text-xs flex items-center justify-center h-[100px]">
                No upcoming expirations
              </div>
            )}
            {items.map((item, idx) => {
              const status = getStatusInfo(item.days);
              return (
                <TooltipProvider key={item.cn + idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-default"
                      >
                        <span className={status.iconClass}>{status.icon}</span>
                        <span className="truncate flex-1 text-xs">{item.cn}</span>
                        <Badge
                          variant="outline"
                          className={status.className + " text-xs px-1.5 py-0"}
                        >
                          {item.days === null || isNaN(item.days)
                            ? 'Invalid'
                            : `${item.days < 0 ? '' : '+'}${item.days} days`}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px]">
                      <p className="text-sm font-medium">{item.cn}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Status: {status.label}
                        {item.days !== null && !isNaN(item.days) && (
                          <> • {Math.abs(item.days)} days {item.days < 0 ? 'ago' : 'remaining'}</>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 