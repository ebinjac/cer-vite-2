import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CertificatesTable } from '@/components/planning/certificates-table'
import { ServiceIdTab } from '@/components/planning/service-id-tab'
import { UpcomingRenewalsTab } from '@/components/planning/upcoming-renewals-tab'
import { usePlanCertificates } from '@/hooks/use-plan-certificates'
import { usePlanServiceIds } from '@/hooks/use-plan-service-ids'
import { useTeamStore } from '@/store/team-store'
import { ShieldCheck, ServerCog, CalendarClock, ClipboardList } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/ui/sidebar'
import { getDaysUntilExpiration } from '@/hooks/use-certificates'

export const Route = createFileRoute('/planning')({
  component: PlanningPage,
})

function PlanningPage() {
  const {
    data: certificatesData,
    isLoading: isLoadingCertificates,
    isError: isErrorCertificates,
    error: errorCertificates,
    parseChecklist: parseCertificateChecklist,
    updateCertificateChecklist
  } = usePlanCertificates()

  const {
    data: serviceIdsData,
    isLoading: isLoadingServiceIds,
    isError: isErrorServiceIds,
    error: errorServiceIds
  } = usePlanServiceIds()

  const { selectedTeam } = useTeamStore()
  
  // Filter data based on selected team
  const [filteredCertificates, setFilteredCertificates] = useState<any[]>([])
  const [filteredServiceIds, setFilteredServiceIds] = useState<any[]>([])
  
  useEffect(() => {
    if (!selectedTeam) {
      setFilteredCertificates(certificatesData || [])
    } else {
      setFilteredCertificates((certificatesData || []).filter(cert => 
        cert.renewingTeamName === selectedTeam
      ))
    }
  }, [certificatesData, selectedTeam])
  
  useEffect(() => {
    if (!selectedTeam) {
      setFilteredServiceIds(serviceIdsData || [])
    } else {
      setFilteredServiceIds((serviceIdsData || []).filter(svcId => 
        svcId.renewingTeamName === selectedTeam
      ))
    }
  }, [serviceIdsData, selectedTeam])

  return (
    <PageTransition keyId="planning">
      <div className="p-6">
        <Card >
          <CardHeader>
            <CardTitle className="text-2xl">Planning</CardTitle>
            <CardDescription>
              Manage and track certificate renewals and service ID updates. Plan ahead and ensure your organization's security credentials are always up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="certificate-renewal" className="w-full">
              <ScrollArea>
                <TabsList className="text-foreground mb-6 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
                  <TabsTrigger 
                    value="certificate-renewal" 
                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <ShieldCheck className="-ms-0.5 me-1.5 opacity-60" size={16} />
                    Certificate Renewal
                    {filteredCertificates.length > 0 && (
                      <Badge className="bg-primary/15 ms-1.5 min-w-5 px-1" variant="secondary">
                        {filteredCertificates.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="service-id" 
                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <ServerCog className="-ms-0.5 me-1.5 opacity-60" size={16} />
                    Service ID
                    {filteredServiceIds.length > 0 && (
                      <Badge className="bg-primary/15 ms-1.5 min-w-5 px-1" variant="secondary">
                        {filteredServiceIds.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upcoming-renewals" 
                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <CalendarClock className="-ms-0.5 me-1.5 opacity-60" size={16} />
                    Upcoming Renewals
                    <Badge className="bg-primary/15 ms-1.5 min-w-5 px-1" variant="secondary">
                      {(certificatesData || []).filter(cert => {
                        const days = getDaysUntilExpiration(cert.validTo)
                        return !cert.underRenewal && days !== null && days > 0 && days <= 90
                      }).length + (serviceIdsData || []).filter(svc => {
                        const days = getDaysUntilExpiration(svc.expDate)
                        return !svc.underRenewal && days !== null && days > 0 && days <= 90
                      }).length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    disabled
                  >
                    <ClipboardList className="-ms-0.5 me-1.5 opacity-60" size={16} />
                    History
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              <TabsContent value="certificate-renewal" className="mt-0 w-full">
                <CertificatesTable 
                  data={certificatesData}
                  isLoading={isLoadingCertificates}
                  isError={isErrorCertificates}
                  error={errorCertificates}
                  parseChecklist={parseCertificateChecklist}
                  updateCertificateChecklist={updateCertificateChecklist}
                />
              </TabsContent>
              <TabsContent value="service-id" className="mt-0 w-full">
                <ServiceIdTab />
              </TabsContent>
              <TabsContent value="upcoming-renewals" className="mt-0 w-full">
                <UpcomingRenewalsTab 
                  certificates={(certificatesData || []).filter(cert => {
                    const days = getDaysUntilExpiration(cert.validTo)
                    // Only show certs that are:
                    // 1. Not already in planning
                    // 2. Expiring within 90 days
                    // 3. Not already expired
                    return !cert.underRenewal && 
                           days !== null && 
                           days > 0 && 
                           days <= 90
                  }).map(cert => ({
                    id: cert.id.toString(),
                    name: cert.commonName,
                    type: 'certificate' as const,
                    expirationDate: cert.validTo,
                    daysUntilExpiration: getDaysUntilExpiration(cert.validTo) || 0,
                    status: cert.currentStatus,
                    environment: 'E1', // Default to E1 since we don't have environment in PlanCertificate
                    team: cert.renewingTeamName
                  }))}
                  serviceIds={(serviceIdsData || []).filter(svc => {
                    const days = getDaysUntilExpiration(svc.expDate)
                    // Only show service IDs that are:
                    // 1. Not already in planning
                    // 2. Expiring within 90 days
                    // 3. Not already expired
                    return !svc.underRenewal && 
                           days !== null && 
                           days > 0 && 
                           days <= 90
                  }).map(svc => ({
                    id: svc.id.toString(),
                    name: svc.scid,
                    type: 'service-id' as const,
                    expirationDate: svc.expDate,
                    daysUntilExpiration: getDaysUntilExpiration(svc.expDate) || 0,
                    status: svc.currentStatus,
                    environment: 'E1', // Default to E1 since we don't have environment in PlanServiceId
                    team: svc.renewingTeamName
                  }))}
                  isLoading={isLoadingCertificates || isLoadingServiceIds}
                  isError={isErrorCertificates || isErrorServiceIds}
                  error={errorCertificates || errorServiceIds || undefined}
                />
              </TabsContent>
              <TabsContent value="history" className="mt-0 w-full">
                <p className="text-muted-foreground pt-4 text-center">
                  Historical renewal data will be available here soon.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
