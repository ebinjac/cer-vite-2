import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, RefreshCcw } from 'lucide-react'
import * as React from 'react'

// ServiceId type definition
export interface ServiceId {
  id: number
  svcid: string
  env: string
  application: string
  lastReset: string
  expDate: string
  renewalProcess: string
  status: string
  acknowledgedBy: string
  appCustodian: string
  svcidOwner: string
  appAimId: string
  description: string
  comment: string
  lastNotification: number
  lastNotificationOn: string
  renewingTeamName: string
  changeNumber: string
}

export type ServiceIdCustomStatus = 'Valid' | 'Expiring Soon' | 'Non-Compliant';

// API endpoint
const SERVICEID_API = 'https://mocki.io/v1/3fe73122-007d-4c9b-9b4d-aee79deb1f80'

// Helper functions
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function getDaysUntilExpiration(expDate: string): number | null {
  if (!expDate) return null;
  
  const expirationDate = new Date(expDate);
  const today = new Date();
  
  // Clear time part for accurate day calculation
  expirationDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

export function getServiceIdCustomStatus(validTo: any): ServiceIdCustomStatus {
  try {
    if (!validTo) return 'Non-Compliant';
    
    const validToDate = new Date(validTo);
    const today = new Date();
    
    // Clear time part for accurate day calculation
    validToDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = validToDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Non-Compliant';
    } else if (diffDays <= 30) {
      return 'Expiring Soon';
    } else {
      return 'Valid';
    }
  } catch (error) {
    // Default to Non-Compliant on error
    return 'Non-Compliant';
  }
}

export const customStatusColors: Record<ServiceIdCustomStatus, string> = {
  'Valid': 'bg-green-100 text-green-800 hover:bg-green-200/80',
  'Expiring Soon': 'bg-amber-100 text-amber-800 hover:bg-amber-200/80',
  'Non-Compliant': 'bg-red-100 text-red-800 hover:bg-red-200/80',
};

export const statusColors: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800 hover:bg-green-200/80',
  'Expired': 'bg-red-100 text-red-800 hover:bg-red-200/80',
  'Pending Reset': 'bg-amber-100 text-amber-800 hover:bg-amber-200/80',
  'Revoked': 'bg-gray-100 text-gray-800 hover:bg-gray-200/80',
};

export const statusIcons: Record<string, React.ReactElement> = {
  'Active': React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
  'Expired': React.createElement(XCircle, { className: "h-4 w-4 text-destructive" }),
  'Pending Reset': React.createElement(RefreshCcw, { className: "h-4 w-4 text-amber-500" }),
  'Revoked': React.createElement(XCircle, { className: "h-4 w-4 text-gray-500" }),
};

export const customStatusIcons: Record<ServiceIdCustomStatus, React.ReactElement> = {
  'Valid': React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
  'Expiring Soon': React.createElement(Clock, { className: "h-4 w-4 text-amber-500" }),
  'Non-Compliant': React.createElement(XCircle, { className: "h-4 w-4 text-destructive" }),
};

/**
 * Custom hook to fetch service ID data
 */
export function useServiceIds() {
  return useQuery<ServiceId[]>({
    queryKey: ['serviceIds'],
    queryFn: async () => {
      try {
        const res = await fetch(SERVICEID_API)
        if (!res.ok) {
          throw new Error(`Failed to fetch service IDs: ${res.status} ${res.statusText}`)
        }
        return res.json()
      } catch (error) {
        console.error('Error fetching service IDs:', error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
} 