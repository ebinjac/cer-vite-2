import * as React from 'react'
import { useRef } from 'react'
import { useCertificates, getDaysUntilExpiration } from '@/hooks/use-certificates'
import { useServiceIds } from '@/hooks/use-serviceids'
import { useTeamStore } from '@/store/team-store'
import generatePDF from 'react-to-pdf'
import { ExportControls, type ExportOptions } from './export-controls'
import { StatusSummary } from './status-summary'

export function ExportReports() {
  const { data: allCertificates } = useCertificates()
  const { data: allServiceIds } = useServiceIds()
  const selectedTeam = useTeamStore((state) => state.selectedTeam)
  const targetRef = useRef(null)

  // Filter data based on selected team
  const certificates = allCertificates?.filter(cert => 
    selectedTeam ? cert.renewingTeamName === selectedTeam : true
  )
  const serviceIds = allServiceIds?.filter(svc => 
    selectedTeam ? svc.renewingTeamName === selectedTeam : true
  )

  const filterByStatus = (items: any[] | undefined, options: ExportOptions) => {
    if (!items) return []
    return items.filter(item => {
      const daysLeft = getDaysUntilExpiration(
        'validTo' in item ? item.validTo : item.expDate
      )
      
      if (!daysLeft || daysLeft <= 0) {
        return options.includeExpired
      } else if (daysLeft <= 30) {
        return options.includeExpiringSoon
      } else {
        return options.includeActive
      }
    })
  }

  const handleExportCSV = () => {
    if (!certificates || !serviceIds) return

    // Prepare data for CSV
    const rows = [
      // Headers
      ['Type', 'Name', 'Status', 'Expiration Date', 'Days Until Expiration', 'Team'],
      // Certificate rows
      ...certificates.map(cert => [
        'Certificate',
        `"${cert.commonName}"`,
        `"${cert.certificateStatus}"`,
        `"${cert.validTo}"`,
        cert.validTo ? getDaysUntilExpiration(cert.validTo)?.toString() : 'N/A',
        `"${cert.renewingTeamName}"`
      ]),
      // Service ID rows
      ...serviceIds.map(svc => [
        'Service ID',
        `"${svc.svcid}"`,
        `"${svc.status}"`,
        `"${svc.expDate}"`,
        svc.expDate ? getDaysUntilExpiration(svc.expDate)?.toString() : 'N/A',
        `"${svc.renewingTeamName}"`
      ])
    ]

    // Convert to CSV with proper line endings
    const csvContent = "data:text/csv;charset=utf-8," + 
      rows.map(row => row.join(',')).join('\r\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `compliance-report${selectedTeam ? `-${selectedTeam}` : ''}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = (options: ExportOptions) => {
    if (!certificates || !serviceIds) return

    const filteredCerts = options.includeCertificates ? filterByStatus(certificates, options) : []
    const filteredServiceIds = options.includeServiceIds ? filterByStatus(serviceIds, options) : []

    if (!filteredCerts.length && !filteredServiceIds.length) return

    generatePDF(targetRef, { 
      filename: `compliance-report${selectedTeam ? `-${selectedTeam}` : ''}.pdf`,
      page: {
        margin: 20,
        format: 'letter'
      }
    })
  }

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: '1px solid #E5E7EB'
  }

  const cellStyles = {
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB'
  }

  const headerCellStyles = {
    ...cellStyles,
    backgroundColor: '#F3F4F6',
    fontWeight: 600,
    textAlign: 'left' as const
  }

  return (
    <>
      <ExportControls onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} />

      {/* Visually hidden but still rendered PDF content */}
      <div className="absolute left-[-9999px] top-0">
        <div ref={targetRef} style={{
          padding: '40px',
          minHeight: '100vh',
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Header with AmEx styling */}
          <div style={{
            backgroundColor: '#006FCF',
            color: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Compliance Report {selectedTeam && `- ${selectedTeam}`}
            </h1>
            <p style={{
              fontSize: '14px',
              opacity: 0.9
            }}>
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Status Summary */}
          <StatusSummary 
            certificates={certificates} 
            serviceIds={serviceIds}
            style={{ marginBottom: '32px' }}
          />

          {/* Certificates Section */}
          {certificates && certificates.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#006FCF',
                marginBottom: '16px'
              }}>
                Certificates
              </h2>
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={headerCellStyles}>Name</th>
                    <th style={headerCellStyles}>Status</th>
                    <th style={headerCellStyles}>Expiration</th>
                    <th style={headerCellStyles}>Days Left</th>
                    <th style={headerCellStyles}>Team</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, i) => (
                    <tr key={i}>
                      <td style={cellStyles}>{cert.commonName}</td>
                      <td style={cellStyles}>{cert.certificateStatus}</td>
                      <td style={cellStyles}>{new Date(cert.validTo).toLocaleDateString()}</td>
                      <td style={cellStyles}>{getDaysUntilExpiration(cert.validTo) ?? 'N/A'}</td>
                      <td style={cellStyles}>{cert.renewingTeamName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Service IDs Section */}
          {serviceIds && serviceIds.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#006FCF',
                marginBottom: '16px'
              }}>
                Service IDs
              </h2>
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={headerCellStyles}>ID</th>
                    <th style={headerCellStyles}>Status</th>
                    <th style={headerCellStyles}>Expiration</th>
                    <th style={headerCellStyles}>Days Left</th>
                    <th style={headerCellStyles}>Team</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceIds.map((svc, i) => (
                    <tr key={i}>
                      <td style={cellStyles}>{svc.svcid}</td>
                      <td style={cellStyles}>{svc.status}</td>
                      <td style={cellStyles}>{new Date(svc.expDate).toLocaleDateString()}</td>
                      <td style={cellStyles}>{getDaysUntilExpiration(svc.expDate) ?? 'N/A'}</td>
                      <td style={cellStyles}>{svc.renewingTeamName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 