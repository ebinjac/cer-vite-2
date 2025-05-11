import { createFileRoute } from '@tanstack/react-router'
import { useCertificates, getDaysUntilExpiration as getCertDaysUntilExpiration, getCertificateCustomStatus } from '@/hooks/use-certificates'
import { useServiceIds, getDaysUntilExpiration as getServiceIdDaysUntilExpiration } from '@/hooks/use-serviceids'
import { useTeamStore } from '@/store/team-store'
import { PageTransition } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState } from 'react'
import { formatDate } from '@/hooks/use-certificates'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from '@/components/ui/badge'
import {
  CertificateStatusPieChart,
  MonthlyCertificateBarChart,
  UpcomingCertificateExpirations,
  CertificateTypePieChart,
  SummaryExpiringRow,
  CertificatesPerApplicationBarChart
} from '@/components/dashboard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: certificatesData, isLoading: isLoadingCertificates } = useCertificates()
  const { data: serviceIdsData, isLoading: isLoadingServiceIds } = useServiceIds()
  const { selectedTeam } = useTeamStore()
  
  // For modal
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalData, setModalData] = useState<any[]>([])
  const [modalType, setModalType] = useState<'certificate' | 'serviceid'>('certificate')
  
  // Filter certificates and service IDs by selected team
  const filteredCertificates = certificatesData?.filter(cert => 
    !selectedTeam || cert.renewingTeamName === selectedTeam
  ) || []
  
  const filteredServiceIds = serviceIdsData?.filter(svcId => 
    !selectedTeam || svcId.renewingTeamName === selectedTeam
  ) || []
  
  // Calculate expiring certificates counts
  const expiring30dCerts = filteredCertificates.filter(cert => {
    const daysLeft = getCertDaysUntilExpiration(cert.validTo)
    return daysLeft !== null && daysLeft > 0 && daysLeft <= 30
  })
  
  const expiring60dCerts = filteredCertificates.filter(cert => {
    const daysLeft = getCertDaysUntilExpiration(cert.validTo)
    return daysLeft !== null && daysLeft > 30 && daysLeft <= 60
  })
  
  const expiring90dCerts = filteredCertificates.filter(cert => {
    const daysLeft = getCertDaysUntilExpiration(cert.validTo)
    return daysLeft !== null && daysLeft > 60 && daysLeft <= 90
  })
  
  // Calculate expiring service IDs counts
  const expiring30dServiceIds = filteredServiceIds.filter(svcId => {
    const daysLeft = getServiceIdDaysUntilExpiration(svcId.expDate)
    return daysLeft !== null && daysLeft > 0 && daysLeft <= 30
  })
  
  const expiring60dServiceIds = filteredServiceIds.filter(svcId => {
    const daysLeft = getServiceIdDaysUntilExpiration(svcId.expDate)
    return daysLeft !== null && daysLeft > 30 && daysLeft <= 60
  })
  
  const expiring90dServiceIds = filteredServiceIds.filter(svcId => {
    const daysLeft = getServiceIdDaysUntilExpiration(svcId.expDate)
    return daysLeft !== null && daysLeft > 60 && daysLeft <= 90
  })
  
  // Certificate status pie chart data
  const statusCounts = filteredCertificates.reduce(
    (acc, cert) => {
      if (cert.certificateStatus === 'Pending') acc.pending++
      else {
        const customStatus = getCertificateCustomStatus(cert.validTo)
        if (customStatus === 'Expired') acc.expired++
        else acc.active++ // Valid or Expiring Soon
      }
      return acc
    },
    { active: 0, pending: 0, expired: 0 }
  )
  const pieData = [
    { status: 'active', value: statusCounts.active },
    { status: 'pending', value: statusCounts.pending },
    { status: 'expired', value: statusCounts.expired }
  ]
  const pieConfig = {
    active: { label: 'Active', color: '#22c55e' },
    pending: { label: 'Pending', color: '#fbbf24' },
    expired: { label: 'Expired', color: '#ef4444' }
  }

  // Monthly certificate bar chart data
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const currentYear = new Date().getFullYear()
  const monthlyData = months.map((month, idx) => {
    const expiring = filteredCertificates.filter(cert => {
      if (!cert.validTo) return false
      const validTo = new Date(cert.validTo)
      const days = getCertDaysUntilExpiration(cert.validTo)
      return validTo.getFullYear() === currentYear && validTo.getMonth() === idx && days !== null && days > 0
    }).length
    const expired = filteredCertificates.filter(cert => {
      if (!cert.validTo) return false
      const validTo = new Date(cert.validTo)
      const days = getCertDaysUntilExpiration(cert.validTo)
      return validTo.getFullYear() === currentYear && validTo.getMonth() === idx && days !== null && days <= 0
    }).length
    return { month, expiring, expired }
  })
  const barConfig = {
    expiring: { label: 'Expiring', color: '#fbbf24' },
    expired: { label: 'Expired', color: '#ef4444' }
  }

  // Upcoming certificate expirations (sorted by days, top 10)
  const upcomingItems = filteredCertificates
    .map(cert => ({ cn: cert.commonName, days: getCertDaysUntilExpiration(cert.validTo) }))
    .sort((a, b) => {
      if (a.days === null) return 1
      if (b.days === null) return -1
      return a.days - b.days
    })
    .slice(0, 10)
  
  // Certificate type pie chart data (only Legacy-BCA, Certaas, Non-Amex)
  const allowedTypes = ['Legacy-BCA', 'Certaas', 'Non-Amex']
  const typeCounts: Record<string, number> = {}
  filteredCertificates.forEach(cert => {
    if (!cert.certType) return
    if (!allowedTypes.includes(cert.certType)) return
    typeCounts[cert.certType] = (typeCounts[cert.certType] || 0) + 1
  })
  const typePalette = [
    '#0ea5e9', // blue
    '#22c55e', // green
    '#fbbf24', // amber
  ]
  const typeKeys = allowedTypes.filter(type => typeCounts[type])
  const typeData = typeKeys.map((type, idx) => ({ type, value: typeCounts[type] }))
  const typeConfig = typeKeys.reduce((acc, type, idx) => {
    acc[type] = {
      label: type,
      color: typePalette[idx % typePalette.length],
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  // Certificates per application bar chart data
  const appStatusMap: Record<string, { active: number; pending: number; expired: number }> = {}
  filteredCertificates.forEach(cert => {
    const app = cert.applicationName || 'Unknown'
    if (!appStatusMap[app]) appStatusMap[app] = { active: 0, pending: 0, expired: 0 }
    if (cert.certificateStatus === 'Pending') appStatusMap[app].pending++
    else {
      const customStatus = getCertificateCustomStatus(cert.validTo)
      if (customStatus === 'Expired') appStatusMap[app].expired++
      else appStatusMap[app].active++
    }
  })
  const appBarData = Object.entries(appStatusMap).map(([application, counts]) => ({ application, ...counts }))
  const appBarConfig = {
    active: { label: 'Active', color: '#22c55e' },
    pending: { label: 'Pending', color: '#fbbf24' },
    expired: { label: 'Expired', color: '#ef4444' }
  }

  // Handle clicks on certificate expiration ranges
  const handleCertificateRangeClick = (range: string, data: any[]) => {
    setModalType('certificate')
    setModalTitle(`Certificates expiring ${range}`)
    setModalData(data)
    setShowModal(true)
  }
  
  // Handle clicks on service ID expiration ranges
  const handleServiceIdRangeClick = (range: string, data: any[]) => {
    setModalType('serviceid')
    setModalTitle(`Service IDs expiring ${range}`)
    setModalData(data)
    setShowModal(true)
  }
  
  // Function to get status color based on days remaining
  const getStatusColor = (days: number | null) => {
    if (days === null) return "text-gray-500";
    if (days <= 7) return "text-red-600 font-bold";
    if (days <= 30) return "text-amber-600 font-medium";
    if (days <= 60) return "text-yellow-600";
    return "text-green-600";
  }
  
  return (
    <PageTransition keyId="dashboard">
      <div className="p-6">
        {/* Summary and Expiring Cards Row */}
        <SummaryExpiringRow
          filteredCertificates={filteredCertificates}
          filteredServiceIds={filteredServiceIds}
          isLoadingCertificates={isLoadingCertificates}
          isLoadingServiceIds={isLoadingServiceIds}
          expiring30dCerts={expiring30dCerts}
          expiring60dCerts={expiring60dCerts}
          expiring90dCerts={expiring90dCerts}
          expiring30dServiceIds={expiring30dServiceIds}
          expiring60dServiceIds={expiring60dServiceIds}
          expiring90dServiceIds={expiring90dServiceIds}
          handleCertificateRangeClick={handleCertificateRangeClick}
          handleServiceIdRangeClick={handleServiceIdRangeClick}
        />
        {/* Dashboard Charts in a single Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="col-span-1 min-h-[350px]">
                <CertificateStatusPieChart
                  statusData={pieData}
                  statusConfig={pieConfig}
                  typeData={typeData}
                  typeConfig={typeConfig}
                  className="border-0 shadow-none h-full"
                />
              </div>
              <div className="md:col-span-2 col-span-1 min-h-[350px]">
                <MonthlyCertificateBarChart data={monthlyData} config={barConfig} className="border-0 shadow-none h-full" />
              </div>
              <div className="col-span-1 min-h-[350px]">
                <UpcomingCertificateExpirations items={upcomingItems} className="border-0 shadow-none h-full" />
              </div>
            </div>
            <CertificatesPerApplicationBarChart
              data={appBarData}
              config={appBarConfig}
              className="mt-4 border-0 shadow-none"
            />
          </CardContent>
        </Card>
        {/* Service IDs Card and Charts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Service IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="col-span-1 min-h-[350px]">
                {/* Service ID Pie Chart with Status and Renewal Process Tabs */}
                <CertificateStatusPieChart
                  statusData={[
                    { status: 'active', value: filteredServiceIds.filter(svc => svc.status === 'Active').length },
                    { status: 'pending', value: filteredServiceIds.filter(svc => svc.status === 'Pending').length },
                    { status: 'expired', value: filteredServiceIds.filter(svc => svc.status === 'Expired').length }
                  ]}
                  statusConfig={{
                    active: { label: 'Active', color: '#22c55e' },
                    pending: { label: 'Pending', color: '#fbbf24' },
                    expired: { label: 'Expired', color: '#ef4444' }
                  }}
                  renewalData={[
                    { status: 'automated', value: filteredServiceIds.filter(svc => svc.renewalProcess === 'Automated').length },
                    { status: 'manual', value: filteredServiceIds.filter(svc => svc.renewalProcess === 'Manual').length }
                  ]}
                  renewalConfig={{
                    automated: { label: 'Automated', color: '#0ea5e9' },
                    manual: { label: 'Manual', color: '#fbbf24' }
                  }}
                  typeData={[]}
                  typeConfig={{}}
                  className="border-0 shadow-none h-full"
                  title="Service IDs"
                  description="Status and Renewal Process"
                />
              </div>
              <div className="md:col-span-2 col-span-1 min-h-[350px]">
                <MonthlyCertificateBarChart
                  data={months.map((month, idx) => {
                    const expiring = filteredServiceIds.filter(svc => {
                      if (!svc.expDate) return false
                      const validTo = new Date(svc.expDate)
                      const days = getServiceIdDaysUntilExpiration(svc.expDate)
                      return validTo.getFullYear() === currentYear && validTo.getMonth() === idx && days !== null && days > 0
                    }).length
                    const expired = filteredServiceIds.filter(svc => {
                      if (!svc.expDate) return false
                      const validTo = new Date(svc.expDate)
                      const days = getServiceIdDaysUntilExpiration(svc.expDate)
                      return validTo.getFullYear() === currentYear && validTo.getMonth() === idx && days !== null && days <= 0
                    }).length
                    return { month, expiring, expired }
                  })}
                  config={{
                    expiring: { label: 'Expiring', color: '#fbbf24' },
                    expired: { label: 'Expired', color: '#ef4444' }
                  }}
                  className="border-0 shadow-none h-full"
                />
              </div>
              <div className="col-span-1 min-h-[350px]">
                <UpcomingCertificateExpirations
                  items={filteredServiceIds
                    .map(svc => ({ cn: svc.svcid, days: getServiceIdDaysUntilExpiration(svc.expDate) }))
                    .sort((a, b) => {
                      if (a.days === null) return 1
                      if (b.days === null) return -1
                      return a.days - b.days
                    })
                    .slice(0, 10)
                  }
                  className="border-0 shadow-none h-full"
                />
              </div>
            </div>
            <CertificatesPerApplicationBarChart
              data={(() => {
                const appStatusMap: Record<string, { active: number; pending: number; expired: number }> = {}
                filteredServiceIds.forEach(svc => {
                  const app = svc.application || 'Unknown'
                  if (!appStatusMap[app]) appStatusMap[app] = { active: 0, pending: 0, expired: 0 }
                  if (svc.status === 'Pending') appStatusMap[app].pending++
                  else if (svc.status === 'Expired') appStatusMap[app].expired++
                  else appStatusMap[app].active++
                })
                return Object.entries(appStatusMap).map(([application, counts]) => ({ application, ...counts }))
              })()}
              config={{
                active: { label: 'Active', color: '#22c55e' },
                pending: { label: 'Pending', color: '#fbbf24' },
                expired: { label: 'Expired', color: '#ef4444' }
              }}
              className="mt-4 border-0 shadow-none"
            />
          </CardContent>
        </Card>

        {/* Modal for expiring details */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="min-w-[90vw] w-[90vw] max-h-[90vh]">
            <DialogHeader className="pb-4 border-b mb-4">
              <DialogTitle className="text-xl font-bold">{modalTitle}</DialogTitle>
              <DialogDescription>
                {modalType === 'certificate' 
                  ? 'Details of certificates that will expire soon. Items highlighted in red require immediate attention.' 
                  : 'Details of service IDs that will expire soon. Items highlighted in red require immediate attention.'}
              </DialogDescription>
            </DialogHeader>
            
            <div>
              {modalData.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold w-1/4">
                          {modalType === 'certificate' ? 'Common Name' : 'Service ID'}
                        </TableHead>
                        <TableHead className="font-semibold">Expiration Date</TableHead>
                        <TableHead className="font-semibold">Days Left</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">
                          {modalType === 'certificate' ? 'Purpose' : 'Application'}
                        </TableHead>
                        <TableHead className="font-semibold">Environment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modalData.map((item, index) => {
                        const daysLeft = modalType === 'certificate' 
                          ? getCertDaysUntilExpiration(item.validTo)
                          : getServiceIdDaysUntilExpiration(item.expDate);
                        const statusColor = getStatusColor(daysLeft);
                        
                        return (
                          <TableRow key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                            <TableCell className="font-medium">
                              {modalType === 'certificate' ? item.commonName : item.svcid}
                            </TableCell>
                            <TableCell>
                              {formatDate(modalType === 'certificate' ? item.validTo : item.expDate)}
                            </TableCell>
                            <TableCell className={statusColor}>
                              {daysLeft} days
                            </TableCell>
                            <TableCell>
                              {daysLeft !== null && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    daysLeft <= 7 && "bg-red-100 text-red-800 border-red-300",
                                    daysLeft > 7 && daysLeft <= 30 && "bg-amber-100 text-amber-800 border-amber-300",
                                    daysLeft > 30 && daysLeft <= 60 && "bg-yellow-100 text-yellow-800 border-yellow-300",
                                    daysLeft > 60 && "bg-green-100 text-green-800 border-green-300"
                                  )}
                                >
                                  {daysLeft <= 7 ? "Critical" : 
                                   daysLeft <= 30 ? "Expiring Soon" : 
                                   daysLeft <= 60 ? "Warning" : "Valid"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {modalType === 'certificate' ? item.purpose : item.application}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {item.env}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md">
                  <p className="text-lg">No items to display</p>
                  <p className="text-sm mt-1">There are no {modalType === 'certificate' ? 'certificates' : 'service IDs'} expiring in this timeframe.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
