import { type ColumnDef } from '@tanstack/react-table'
import type { Certificate } from '@/hooks/use-certificates'
import { type CertificateCustomStatus } from '@/hooks/use-certificates'

// Define all possible column IDs
export type AllColumnIds = 
  | 'select'
  | 'actions'
  | 'commonName'
  | 'serialNumber'
  | 'customStatus'
  | 'validFrom'
  | 'validTo'
  | 'applicationName'
  | 'zeroTouch'
  | 'hostingTeamName'
  | 'certificatePurpose'
  | 'certificateStatus'
  | 'comment'
  | 'certificateIdentifier'
  | 'currentCert'
  | 'environment'
  | 'subjectAlternateNames'
  | 'issuerCertAuthName'
  | 'certType'
  | 'idaasIntegrationId'
  | 'isAmexCert'
  | 'centralID'
  | 'uri'
  | 'acknowledgedBy'
  | 'lastNotification'
  | 'lastNotificationOn'
  | 'renewingTeamName'
  | 'changeNumber'
  | 'serverName'
  | 'keystorePath'
  | 'daysLeft'

// Type for column visibility
export type ColumnVisibilityState = {
  [K in AllColumnIds]: boolean;
};

// Update column categories with proper typing
export const columnCategories: Record<string, readonly AllColumnIds[]> = {
  essential: [
    'select',
    'commonName',
    'serialNumber',
    'customStatus',
    'validFrom',
    'validTo',
    'daysLeft',
    'applicationName',
    'zeroTouch',
    'hostingTeamName',
    'certificatePurpose',
    'certificateStatus'
  ],
  details: [
    'certificateIdentifier',
    'currentCert',
    'environment',
    'subjectAlternateNames',
    'issuerCertAuthName',
    'certType'
  ],
  integration: [
    'idaasIntegrationId',
    'isAmexCert',
    'centralID',
    'uri'
  ],
  management: [
    'acknowledgedBy',
    'lastNotification',
    'lastNotificationOn',
    'renewingTeamName',
    'changeNumber',
    'serverName',
    'keystorePath'
  ]
} as const;

// Helper function to get formatted column name
export const getFormattedColumnName = (columnId: string): string => {
  const columnMap: Record<string, string> = {
    select: 'Select',
    commonName: 'Common Name',
    serialNumber: 'Serial Number',
    customStatus: 'Status',
    validFrom: 'Valid From',
    validTo: 'Valid To',
    applicationName: 'Application',
    zeroTouch: 'Zero Touch',
    hostingTeamName: 'Hosting Team',
    certificatePurpose: 'Purpose',
    certificateStatus: 'Certificate Status',
    comment: 'Comment',
    certificateIdentifier: 'Certificate Identifier',
    currentCert: 'Current Cert',
    environment: 'Environment',
    subjectAlternateNames: 'Subject Alternate Names',
    issuerCertAuthName: 'Issuer',
    certType: 'Certificate Type',
    idaasIntegrationId: 'IDaaS Integration ID',
    isAmexCert: 'Is Amex Cert',
    centralID: 'Central ID',
    uri: 'URI',
    acknowledgedBy: 'Acknowledged By',
    lastNotification: 'Last Notification',
    lastNotificationOn: 'Last Notification On',
    renewingTeamName: 'Renewing Team',
    changeNumber: 'Change Number',
    serverName: 'Server',
    keystorePath: 'Keystore Path',
    daysLeft: 'Days Left',
  };

  return columnMap[columnId] || columnId.replace(/([A-Z])/g, ' $1').trim();
};

// Default column visibility
export const defaultColumnVisibility: ColumnVisibilityState = {
  select: true,
  commonName: true,
  serialNumber: true,
  customStatus: true,
  validFrom: true,
  validTo: true,
  daysLeft: true,
  applicationName: true,
  zeroTouch: true,
  hostingTeamName: true,
  certificatePurpose: true,
  certificateStatus: true,
  comment: true,
  actions: true,
  // Hide other columns initially
  certificateIdentifier: false,
  currentCert: false,
  environment: false,
  subjectAlternateNames: false,
  issuerCertAuthName: false,
  certType: false,
  idaasIntegrationId: false,
  isAmexCert: false,
  centralID: false,
  uri: false,
  acknowledgedBy: false,
  lastNotification: false,
  lastNotificationOn: false,
  renewingTeamName: false,
  changeNumber: false,
  serverName: false,
  keystorePath: false,
};

// Searchable fields array
export const searchableFields: string[] = [
  'commonName', 'certificateStatus', 'certificatePurpose', 
  'environment', 'issuerCertAuthName', 'hostingTeamName', 
  'renewingTeamName', 'applicationName', 'serverName', 
  'serialNumber', 'uri', 'certType', 'validFrom', 'validTo',
  'certificateIdentifier', 'currentCert', 'subjectAlternateNames',
  'zeroTouch', 'idaasIntegrationId', 'isAmexCert', 'acknowledgedBy',
  'centralID', 'comment', 'lastNotification', 'lastNotificationOn',
  'changeNumber', 'keystorePath'
];

// Expiration filter options
export const expirationFilterOptions = [
  { value: '30', label: 'Expires in 30 days' },
  { value: '60', label: 'Expires in 60 days' },
  { value: '90', label: 'Expires in 90 days' }
];

// Certificate table props
export interface CertificateTableProps {
  data: Certificate[]
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
  purpose?: string[]
  hostname?: string
  issuer?: string
  team?: string
  customFilters: FilterCriteria[]
} 