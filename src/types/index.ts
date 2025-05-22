// Certificate and Service ID types
export interface Certificate {
  commonName: string
  certificateStatus: string
  validTo: string
  renewingTeamName: string
}

export interface ServiceId {
  svcid: string
  status: string
  expDate: string
  renewingTeamName: string
}

// Re-export all types
export type * from './index' 