import { useQuery } from '@tanstack/react-query'
import { CERT_API } from '@/lib/api-endpoints'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import * as React from 'react'

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

export type CertificateCustomStatus = 'Valid' | 'Expiring Soon' | 'Expired';

// Helper functions
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function getDaysUntilExpiration(validTo: string): number | null {
  if (!validTo) return null;
  
  const validToDate = new Date(validTo);
  const today = new Date();
  
  // Clear time part for accurate day calculation
  validToDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = validToDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

export function getCertificateCustomStatus(validTo: string): CertificateCustomStatus {
  const daysUntil = getDaysUntilExpiration(validTo);
  
  if (daysUntil === 0) {
    return 'Expired';
  } else if (daysUntil && daysUntil <= 30) {
    return 'Expiring Soon';
  } else {
    return 'Valid';
  }
}

export const customStatusColors: Record<CertificateCustomStatus, string> = {
  'Valid': 'bg-green-100 text-green-800 hover:bg-green-200/80',
  'Expiring Soon': 'bg-amber-100 text-amber-800 hover:bg-amber-200/80',
  'Expired': 'bg-red-100 text-red-800 hover:bg-red-200/80',
};

export const customStatusIcons: Record<CertificateCustomStatus, React.ReactElement> = {
  'Valid': React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
  'Expiring Soon': React.createElement(Clock, { className: "h-4 w-4 text-amber-500" }),
  'Expired': React.createElement(XCircle, { className: "h-4 w-4 text-destructive" }),
};

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