import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { useCertificates, getDaysUntilExpiration, type Certificate } from '@/hooks/use-certificates'
import { useServiceIds, type ServiceId } from '@/hooks/use-serviceids'
import { motion } from 'framer-motion'
import { ShieldCheck, ServerCog, Gauge, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTeamStore } from '@/store/team-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExportReports } from './export-reports'

export function ComplianceScoreCard() {
  const { data: certificates } = useCertificates()
  const { data: serviceIds } = useServiceIds()
  const selectedTeam = useTeamStore((state) => state.selectedTeam)
  const [scores, setScores] = React.useState({ total: 0, certificates: 0, serviceIds: 0 })

  React.useEffect(() => {
    if (!certificates || !serviceIds) return

    // Filter data by selected team
    const teamCertificates = selectedTeam 
      ? certificates.filter(cert => cert.renewingTeamName === selectedTeam)
      : certificates
    const teamServiceIds = selectedTeam
      ? serviceIds.filter(svc => svc.renewingTeamName === selectedTeam)
      : serviceIds

    // Calculate certificate compliance
    const certCompliant = teamCertificates.reduce((acc, cert) => {
      const daysUntil = getDaysUntilExpiration(cert.validTo)
      if (daysUntil === null || daysUntil <= 0) return acc
      if (daysUntil <= 30) return acc + 0.5 // Partial compliance if expiring soon
      return acc + 1
    }, 0)

    // Calculate service ID compliance
    const svcCompliant = teamServiceIds.reduce((acc, svc) => {
      const daysUntil = getDaysUntilExpiration(svc.expDate)
      if (daysUntil === null || daysUntil <= 0) return acc
      if (daysUntil <= 30) return acc + 0.5 // Partial compliance if expiring soon
      return acc + 1
    }, 0)

    const certScore = teamCertificates.length 
      ? Math.round((certCompliant / teamCertificates.length) * 100)
      : 0
    const svcScore = teamServiceIds.length 
      ? Math.round((svcCompliant / teamServiceIds.length) * 100)
      : 0
    
    // Calculate total score with proper weighting based on number of items
    const totalItems = teamCertificates.length + teamServiceIds.length
    if (totalItems === 0) {
      setScores({ total: 0, certificates: 0, serviceIds: 0 })
      return
    }

    const certWeight = teamCertificates.length / totalItems
    const svcWeight = teamServiceIds.length / totalItems
    const totalScore = Math.round((certScore * certWeight) + (svcScore * svcWeight))

    setScores({
      total: totalScore,
      certificates: certScore,
      serviceIds: svcScore
    })
  }, [certificates, serviceIds, selectedTeam])

  const getItemCounts = (type: 'certificates' | 'serviceIds') => {
    const items = type === 'certificates' ? certificates : serviceIds
    if (!items) return { total: 0, compliant: 0, expiringSoon: 0, expired: 0 }

    // Filter by selected team
    const teamItems = selectedTeam
      ? items.filter(item => item.renewingTeamName === selectedTeam)
      : items

    return teamItems.reduce((acc, item) => {
      const daysUntil = getDaysUntilExpiration(
        type === 'certificates' 
          ? (item as Certificate).validTo 
          : (item as ServiceId).expDate
      )
      if (daysUntil === null || daysUntil <= 0) acc.expired++
      else if (daysUntil <= 30) acc.expiringSoon++
      else acc.compliant++
      acc.total++
      return acc
    }, { total: 0, compliant: 0, expiringSoon: 0, expired: 0 })
  }

  const certCounts = getItemCounts('certificates')
  const svcCounts = getItemCounts('serviceIds')

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary/60" />
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Compliance Score</div>
              <div className="text-xs text-muted-foreground">
                Based on {certCounts.total + svcCounts.total} total items
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-secondary/20">
                <motion.div
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-full",
                    scores.total === 0 ? "bg-destructive" :
                    scores.total === 100 ? "bg-emerald-500" :
                    "bg-primary"
                  )}
                  style={{ width: `${scores.total}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${scores.total}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-end">
                <span className={cn(
                  "text-3xl font-bold",
                  scores.total === 0 ? "text-destructive" :
                  scores.total === 100 ? "text-emerald-500" :
                  "text-primary"
                )}>
                  {scores.total}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary/60" />
              Export Report
            </CardTitle>
            <CardDescription>
              Download compliance reports in your preferred format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportReports />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary/60" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">Compliance Score</div>
              <div className="text-xs text-muted-foreground">
                {certCounts.compliant} compliant, {certCounts.expiringSoon} expiring soon
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-secondary/20">
                <motion.div
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-full",
                    scores.certificates === 0 ? "bg-destructive/50" :
                    scores.certificates === 100 ? "bg-emerald-500" :
                    "bg-primary/50"
                  )}
                  style={{ width: `${scores.certificates}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${scores.certificates}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <div className="flex justify-end">
                <span className={cn(
                  "text-2xl font-semibold",
                  scores.certificates === 0 ? "text-destructive" :
                  scores.certificates === 100 ? "text-emerald-500" :
                  "text-primary"
                )}>
                  {scores.certificates}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ServerCog className="h-5 w-5 text-primary/60" />
                Service IDs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">Compliance Score</div>
              <div className="text-xs text-muted-foreground">
                {svcCounts.compliant} compliant, {svcCounts.expiringSoon} expiring soon
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-secondary/20">
                <motion.div
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-full",
                    scores.serviceIds === 0 ? "bg-destructive/50" :
                    scores.serviceIds === 100 ? "bg-emerald-500" :
                    "bg-primary/50"
                  )}
                  style={{ width: `${scores.serviceIds}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${scores.serviceIds}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
                />
              </div>
              <div className="flex justify-end">
                <span className={cn(
                  "text-2xl font-semibold",
                  scores.serviceIds === 0 ? "text-destructive" :
                  scores.serviceIds === 100 ? "text-emerald-500" :
                  "text-primary"
                )}>
                  {scores.serviceIds}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 