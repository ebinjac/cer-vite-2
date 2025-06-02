import { useQuery } from '@tanstack/react-query'
import { SERVICEID_API } from '@/lib/api-endpoints'
import { CheckCircle, XCircle, Clock, RefreshCcw, HelpCircle } from 'lucide-react'
import * as React from 'react'
import { format } from "date-fns"

// ServiceId type definition
export interface ServiceId {
  id: number
  svcid: string
  env: string
  application: string
  renewingTeamName: string
  status: string
  lastReset: string
  expDate: string
  renewalProcess: string
  svcidOwner: string
  appCustodian: string
  appAimId: string
  acknowledgedBy: string
  changeNumber: string
  lastNotification: string
  lastNotificationOn: string
  description: string
  comment: string
}

export type ServiceIdCustomStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Unknown' | 'Non-Compliant'

// Helper functions
export const formatDate = (date: string | undefined): string | undefined => {
  if (!date) return undefined
  return format(new Date(date), "MMM dd, yyyy")
}

export const getDaysUntilExpiration = (expDate: string | undefined): number | null => {
  if (!expDate) return null
  const today = new Date()
  const expiryDate = new Date(expDate)
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export const getServiceIdCustomStatus = (expDate: string | undefined): ServiceIdCustomStatus => {
  const daysLeft = getDaysUntilExpiration(expDate)
  if (daysLeft === null) return "Unknown"
  if (daysLeft === 0) return "Non-Compliant"
  if (daysLeft <= 30) return "Expiring Soon"
  return "Valid"
}

export const customStatusColors: Record<ServiceIdCustomStatus, string> = {
  Valid: "bg-green-100 text-green-800 border-green-200",
  Expired: "bg-red-100 text-red-800 border-red-200",
  "Expiring Soon": "bg-amber-100 text-amber-800 border-amber-200",
  Unknown: "bg-muted text-muted-foreground",
  "Non-Compliant": "bg-red-100 text-red-800 border-red-200"
}

export const statusColors: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800 hover:bg-green-200/80',
  'Expired': 'bg-red-100 text-red-800 hover:bg-red-200/80',
  'Pending Reset': 'bg-amber-100 text-amber-800 hover:bg-amber-200/80',
  'Revoked': 'bg-gray-100 text-gray-800 hover:bg-gray-200/80',
};

export const statusIcons: Record<ServiceIdCustomStatus, React.ReactElement> = {
  Valid: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
  "Expiring Soon": React.createElement(Clock, { className: "h-4 w-4 text-amber-500" }),
  Expired: React.createElement(XCircle, { className: "h-4 w-4 text-destructive" }),
  Unknown: React.createElement(HelpCircle, { className: "h-4 w-4 text-muted-foreground" }),
  "Non-Compliant": React.createElement(XCircle, { className: "h-4 w-4 text-destructive" })
}

export const customStatusIcons: Record<ServiceIdCustomStatus, React.ReactElement> = {
  Valid: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }),
  "Expiring Soon": React.createElement(Clock, { className: "h-4 w-4 text-amber-500" }),
  Expired: React.createElement(XCircle, { className: "h-4 w-4 text-destructive" }),
  Unknown: React.createElement(HelpCircle, { className: "h-4 w-4 text-muted-foreground" }),
  "Non-Compliant": React.createElement(XCircle, { className: "h-4 w-4 text-destructive" })
}

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