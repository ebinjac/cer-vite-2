import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useTeamStore } from '@/store/team-store'
import { useCertificates, getDaysUntilExpiration } from '@/hooks/use-certificates'
import { useServiceIds } from '@/hooks/use-serviceids'
import { ShieldCheck, ServerCog, AlertTriangle, XCircle, PieChart, InfoIcon } from "lucide-react"
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ComplianceInfo } from './compliance-info'

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Compliance Breakdown
          </CardTitle>
          <ComplianceInfo />
        </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Fully Compliant</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-emerald-700">{item.compliant}</span>
                  <span className="text-sm text-emerald-600">items</span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">More than 30 days until expiration</p>
              </div>

              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Expiring Soon</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-amber-700">{item.expiringSoon}</span>
                  <span className="text-sm text-amber-600">items</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">30 days or less until expiration</p>
              </div>

              <div className="bg-destructive/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Expired</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-destructive">{item.expired}</span>
                  <span className="text-sm text-destructive/80">items</span>
                </div>
                <p className="text-xs text-destructive/80 mt-1">Already expired</p>
              </div>
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

            <div className="text-xs text-muted-foreground">
              Score calculation: ({item.compliant} × 1.0 + {item.expiringSoon} × 0.5) ÷ {item.total} × 100 = {item.score}%
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
} 