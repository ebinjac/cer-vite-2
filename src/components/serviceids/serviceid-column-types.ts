import { type ColumnDef } from '@tanstack/react-table'
import type { ServiceId } from '@/hooks/use-serviceids'
import { type ServiceIdCustomStatus } from '@/hooks/use-serviceids'

// Define all possible column IDs
export type AllColumnIds = 
  | 'select'
  | 'actions'
  | 'svcid'
  | 'env'
  | 'application'
  | 'lastReset'
  | 'expDate'
  | 'renewalProcess'
  | 'status'
  | 'acknowledgedBy'
  | 'appCustodian'
  | 'svcidOwner'
  | 'appAimId'
  | 'description'
  | 'comment'
  | 'lastNotification'
  | 'lastNotificationOn'
  | 'renewingTeamName'
  | 'changeNumber'
  | 'daysLeft'
  | 'customStatus'

// Type for column visibility
export type ColumnVisibilityState = {
  [K in AllColumnIds]: boolean;
};

// Update column categories with proper typing
export const columnCategories: Record<string, readonly AllColumnIds[]> = {
  essential: [
    'select',
    'svcid',
    'application',
    'env',
    'customStatus',
    'expDate',
    'daysLeft',
    'status',
    'renewalProcess'
  ],
  details: [
    'description',
    'lastReset',
    'appAimId',
    'changeNumber'
  ],
  ownership: [
    'acknowledgedBy',
    'appCustodian',
    'svcidOwner',
    'renewingTeamName'
  ],
  notifications: [
    'lastNotification',
    'lastNotificationOn',
    'comment'
  ]
} as const;

// Helper function to get formatted column name
export const getFormattedColumnName = (columnId: string): string => {
  const columnMap: Record<string, string> = {
    select: 'Select',
    svcid: 'Service ID',
    env: 'Environment',
    application: 'Application',
    lastReset: 'Last Reset',
    expDate: 'Expiration Date',
    renewalProcess: 'Renewal Process',
    status: 'Status',
    acknowledgedBy: 'Acknowledged By',
    appCustodian: 'App Custodian',
    svcidOwner: 'Service ID Owner',
    appAimId: 'App AIM ID',
    description: 'Description',
    comment: 'Comment',
    lastNotification: 'Last Notification',
    lastNotificationOn: 'Last Notification On',
    renewingTeamName: 'Renewing Team',
    changeNumber: 'Change Number',
    daysLeft: 'Days Left',
    customStatus: 'Expiration Status',
  };

  return columnMap[columnId] || columnId.replace(/([A-Z])/g, ' $1').trim();
};

// Default column visibility
export const defaultColumnVisibility: ColumnVisibilityState = {
  select: true,
  actions: true,
  svcid: true,
  env: true,
  application: true,
  lastReset: false,
  expDate: true,
  renewalProcess: true,
  status: true,
  acknowledgedBy: false,
  appCustodian: false,
  svcidOwner: false,
  appAimId: false,
  description: false,
  comment: true,
  lastNotification: false,
  lastNotificationOn: false,
  renewingTeamName: true,
  changeNumber: false,
  daysLeft: true,
  customStatus: true
};

// Searchable fields array
export const searchableFields: string[] = [
  'svcid', 'env', 'application', 'renewalProcess',
  'status', 'acknowledgedBy', 'appCustodian',
  'svcidOwner', 'appAimId', 'description',
  'comment', 'renewingTeamName', 'changeNumber'
];

// Expiration filter options
export const expirationFilterOptions = [
  { value: '30', label: 'Expires in 30 days' },
  { value: '60', label: 'Expires in 60 days' },
  { value: '90', label: 'Expires in 90 days' }
];

// ServiceId table props
export interface ServiceIdTableProps {
  data: ServiceId[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
  teamName?: string
}

// Filter criteria type
export type FilterCriteria = {
  field: string
  operator: string
  value: string | string[]
}

// Advanced filters type
export type AdvFilters = {
  expiresIn?: '30' | '60' | '90' | null
  status?: string[]
  environment?: string[]
  application?: string[]
  hostname?: string
  team?: string
  customFilters: FilterCriteria[]
} 