
import { SummaryCard } from './SummaryCard'
import { ExpiringGroupCard } from './ExpiringGroupCard'

interface ExpiringItem {
  label: string
  count: number
  suffix: string
  colorClass: string
  onClick?: () => void
}

interface SummaryExpiringRowProps {
  filteredCertificates: any[]
  filteredServiceIds: any[]
  isLoadingCertificates: boolean
  isLoadingServiceIds: boolean
  expiring30dCerts: any[]
  expiring60dCerts: any[]
  expiring90dCerts: any[]
  expiring30dServiceIds: any[]
  expiring60dServiceIds: any[]
  expiring90dServiceIds: any[]
  handleCertificateRangeClick: (range: string, data: any[]) => void
  handleServiceIdRangeClick: (range: string, data: any[]) => void
}

export function SummaryExpiringRow({
  filteredCertificates,
  filteredServiceIds,
  isLoadingCertificates,
  isLoadingServiceIds,
  expiring30dCerts,
  expiring60dCerts,
  expiring90dCerts,
  expiring30dServiceIds,
  expiring60dServiceIds,
  expiring90dServiceIds,
  handleCertificateRangeClick,
  handleServiceIdRangeClick,
}: SummaryExpiringRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <SummaryCard 
        title="All Certificates" 
        count={filteredCertificates.length} 
        suffix="certs"
        isLoading={isLoadingCertificates}
        chartData={[]}
      />
      <SummaryCard 
        title="All Service ID's" 
        count={filteredServiceIds.length} 
        suffix="id's"
        isLoading={isLoadingServiceIds}
        chartData={[]}
      />
      <ExpiringGroupCard 
        title="Certificates expiring in (30d, 60d, 90d)"
        isLoading={isLoadingCertificates}
        items={[
          { 
            label: "< 30", 
            count: expiring30dCerts.length, 
            suffix: "certs", 
            colorClass: "bg-red-500",
            onClick: () => handleCertificateRangeClick("in less than 30 days", expiring30dCerts)
          },
          { 
            label: "30-60", 
            count: expiring60dCerts.length, 
            suffix: "certs", 
            colorClass: "bg-amber-500",
            onClick: () => handleCertificateRangeClick("in 30-60 days", expiring60dCerts)
          },
          { 
            label: "60-90", 
            count: expiring90dCerts.length, 
            suffix: "certs", 
            colorClass: "bg-yellow-500",
            onClick: () => handleCertificateRangeClick("in 60-90 days", expiring90dCerts)
          }
        ]}
      />
      <ExpiringGroupCard 
        title="Service ID's expiring in (30d, 60d, 90d)"
        isLoading={isLoadingServiceIds}
        items={[
          { 
            label: "< 30", 
            count: expiring30dServiceIds.length, 
            suffix: "id", 
            colorClass: "bg-red-500",
            onClick: () => handleServiceIdRangeClick("in less than 30 days", expiring30dServiceIds)
          },
          { 
            label: "30-60", 
            count: expiring60dServiceIds.length, 
            suffix: "id", 
            colorClass: "bg-amber-500",
            onClick: () => handleServiceIdRangeClick("in 30-60 days", expiring60dServiceIds)
          },
          { 
            label: "60-90", 
            count: expiring90dServiceIds.length, 
            suffix: "id", 
            colorClass: "bg-yellow-500",
            onClick: () => handleServiceIdRangeClick("in 60-90 days", expiring90dServiceIds)
          }
        ]}
      />
    </div>
  )
} 