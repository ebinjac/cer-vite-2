import { useQuery } from '@tanstack/react-query'

// Certificate type definition
export interface Certificate {
  id: number
  commonName: string
  certificateIdentifier: string
  certificateStatus: 'Issued' | 'Expired' | 'Pending' | 'Revoked' | string
  certificatePurpose: string
  currentCert: string
  environment: string
  serialNumber: string
  validFrom: string
  validTo: string
  subjectAlternateNames: string
  zeroTouch: string
  issuerCertAuthName: string
  hostingTeamName: string
  idaasIntegrationId: string
  isAmexCert: string
  certType: string
  acknowledgedBy: string
  centralID: string
  applicationName: string
  comment: string
  lastNotification: number
  lastNotificationOn: string
  renewingTeamName: string
  changeNumber: string
  serverName: string
  keystorePath: string
  uri: string
}

// API endpoint
const CERT_API = 'https://mocki.io/v1/41d9dd5c-1bab-44e3-a80f-b6cdaebdf70b'

// Helper functions
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

/**
 * Custom hook to fetch certificate data
 */
export function useCertificates() {
  return useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn: async () => {
      try {
        const res = await fetch(CERT_API)
        if (!res.ok) {
          throw new Error(`Failed to fetch certificates: ${res.status} ${res.statusText}`)
        }
        return res.json()
      } catch (error) {
        console.error('Error fetching certificates:', error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
} 