import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Certificate, ServiceId } from '../../types'
import { getDaysUntilExpiration } from '@/hooks/use-certificates'

interface StatusCounts {
  active: number
  expired: number
  expiringSoon: number
  total: number
}

interface StatusSummaryProps {
  certificates?: Certificate[]
  serviceIds?: ServiceId[]
  style?: React.CSSProperties
}

export function StatusSummary({ certificates = [], serviceIds = [], style }: StatusSummaryProps) {
  const getCounts = (items: Array<Certificate | ServiceId>): StatusCounts => {
    return items.reduce((acc, item) => {
      const daysLeft = getDaysUntilExpiration(
        'validTo' in item ? item.validTo : item.expDate
      )
      
      if (!daysLeft || daysLeft <= 0) {
        acc.expired++
      } else if (daysLeft <= 30) {
        acc.expiringSoon++
      } else {
        acc.active++
      }
      acc.total++
      return acc
    }, { active: 0, expired: 0, expiringSoon: 0, total: 0 })
  }

  const certCounts = getCounts(certificates)
  const serviceCounts = getCounts(serviceIds)

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gap: '16px'
  }

  const blockContainerStyle: React.CSSProperties = {
    marginBottom: '8px'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: '8px'
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  }

  const statContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }

  const statValueStyle = (type: 'active' | 'expired' | 'expiringSoon' | 'total'): React.CSSProperties => ({
    fontSize: '24px',
    fontWeight: 700,
    color: type === 'active' ? '#059669' :
           type === 'expired' ? '#DC2626' :
           type === 'expiringSoon' ? '#D97706' :
           '#4B5563'
  })

  const statLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280'
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden'
  }

  const cardHeaderStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid #E5E7EB'
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827'
  }

  const cardContentStyle: React.CSSProperties = {
    padding: '20px'
  }

  const StatusBlock = ({ title, counts }: { title: string, counts: StatusCounts }) => (
    <div style={blockContainerStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={gridStyle}>
        <div style={statContainerStyle}>
          <div style={statValueStyle('active')}>{counts.active}</div>
          <div style={statLabelStyle}>Active</div>
        </div>
        <div style={statContainerStyle}>
          <div style={statValueStyle('expired')}>{counts.expired}</div>
          <div style={statLabelStyle}>Expired</div>
        </div>
        <div style={statContainerStyle}>
          <div style={statValueStyle('expiringSoon')}>{counts.expiringSoon}</div>
          <div style={statLabelStyle}>Expiring Soon</div>
        </div>
        <div style={statContainerStyle}>
          <div style={statValueStyle('total')}>{counts.total}</div>
          <div style={statLabelStyle}>Total</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ ...containerStyle, ...style }}>
      {certificates.length > 0 && (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Certificates Status</h2>
          </div>
          <div style={cardContentStyle}>
            <StatusBlock title="Certificate Counts" counts={certCounts} />
          </div>
        </div>
      )}

      {serviceIds.length > 0 && (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Service IDs Status</h2>
          </div>
          <div style={cardContentStyle}>
            <StatusBlock title="Service ID Counts" counts={serviceCounts} />
          </div>
        </div>
      )}
    </div>
  )
} 