import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useTeamStore } from '@/store/team-store'
import { useCertificates, getDaysUntilExpiration } from '@/hooks/use-certificates'
import { useServiceIds } from '@/hooks/use-serviceids'
import { ShieldCheck, ServerCog, AlertTriangle, XCircle, PieChart } from "lucide-react"
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ComplianceItem {
  category: string
  icon: React.ReactNode
  total: number
  compliant: number
  expiringSoon: number
  expired: number
  score: number
}

export function ComplianceBreakdown() {
  const selectedTeam = useTeamStore((state) => state.selectedTeam)
  const { data: certificates } = useCertificates()
  const { data: serviceIds } = useServiceIds()
  const [data, setData] = React.useState<ComplianceItem[]>([])

  React.useEffect(() => {
    if (!certificates || !serviceIds) return

    // Filter by selected team if any
    const teamCertificates = selectedTeam 
      ? certificates.filter(cert => cert.renewingTeamName === selectedTeam)
      : certificates
    const teamServiceIds = selectedTeam
      ? serviceIds.filter(svc => svc.renewingTeamName === selectedTeam)
      : serviceIds

    // Calculate metrics for certificates
    const certMetrics = teamCertificates.reduce((acc, cert) => {
      const daysUntil = getDaysUntilExpiration(cert.validTo)
      if (daysUntil === null || daysUntil <= 0) acc.expired++
      else if (daysUntil <= 30) acc.expiringSoon++
      else acc.compliant++
      acc.total++
      return acc
    }, { total: 0, compliant: 0, expiringSoon: 0, expired: 0 })

    // Calculate metrics for service IDs
    const svcMetrics = teamServiceIds.reduce((acc, svc) => {
      const daysUntil = getDaysUntilExpiration(svc.expDate)
      if (daysUntil === null || daysUntil <= 0) acc.expired++
      else if (daysUntil <= 30) acc.expiringSoon++
      else acc.compliant++
      acc.total++
      return acc
    }, { total: 0, compliant: 0, expiringSoon: 0, expired: 0 })

    const complianceData: ComplianceItem[] = [
      {
        category: 'Certificates',
        icon: <ShieldCheck className="h-5 w-5 text-primary" />,
        ...certMetrics,
        score: certMetrics.total > 0 
          ? Math.round(((certMetrics.compliant + (certMetrics.expiringSoon * 0.5)) / certMetrics.total) * 100)
          : 0
      },
      {
        category: 'Service IDs',
        icon: <ServerCog className="h-5 w-5 text-primary" />,
        ...svcMetrics,
        score: svcMetrics.total > 0
          ? Math.round(((svcMetrics.compliant + (svcMetrics.expiringSoon * 0.5)) / svcMetrics.total) * 100)
          : 0
      }
    ]

    setData(complianceData)
  }, [certificates, serviceIds, selectedTeam])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Compliance Breakdown
        </CardTitle>
        <CardDescription>
          Detailed compliance metrics by category
          {selectedTeam ? ` for ${selectedTeam}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {data.map((item, index) => (
          <motion.div
            key={item.category}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.icon}
                <h3 className="text-base font-medium">{item.category}</h3>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  item.score === 0 ? "border-destructive text-destructive" :
                  item.score === 100 ? "border-emerald-500 text-emerald-500" :
                  "border-primary text-primary"
                )}
              >
                {item.score}% Compliant
              </Badge>
            </div>

            <div className="relative h-2 overflow-hidden rounded-full bg-secondary/20">
              <motion.div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full",
                  item.score === 0 ? "bg-destructive/50" :
                  item.score === 100 ? "bg-emerald-500" :
                  "bg-primary/50"
                )}
                style={{ width: `${item.score}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-semibold">{item.total}</div>
              </div>
              
              <div className="space-y-1.5">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Compliant
                </div>
                <div className="text-2xl font-semibold text-emerald-500">
                  {item.compliant}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Expiring Soon
                </div>
                <div className="text-2xl font-semibold text-amber-500">
                  {item.expiringSoon}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Expired
                </div>
                <div className="text-2xl font-semibold text-destructive">
                  {item.expired}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
} 