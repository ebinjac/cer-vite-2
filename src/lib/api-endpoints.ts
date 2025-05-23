// Centralized API endpoints for all services
// Update these values to change API URLs in one place

export const CERT_API = 'https://mocki.io/v1/628243bc-9d5f-4708-b4e5-9fd53c486bae'
export const SERVICEID_API = 'https://mocki.io/v1/3fe73122-007d-4c9b-9b4d-aee79deb1f80'
export const CERTIFICATE_SAVE_API = 'http://localhost:5000/api/v2/certificate/savetodb'
export const CERTIFICATE_UPDATE_API = '/api/v1/updatecert'
export const CERTIFICATE_RENEW_API = '/api/v1/renewal'
export const CERTIFICATE_DELETE_API = (commonName: string) => `/api/v1/deletecert/${commonName}`
export const CERTIFICATE_SEARCH_API = (commonName: string) => `/api/v1/searchcertificate/${commonName}`
export const APPLICATION_LIST_API = (teamName: string) => `/api/v1/contact/applist/${teamName}`
export const TEAMS_API = '/api/v1/teams'
export const PLANNING_CERTIFICATE_API = 'https://mocki.io/v1/4228fd83-dc0e-4e0b-86e7-4212c91d26b0'
export const PLANNING_CERTIFICATE_UPDATE_API = (id: number) => `/api/v1/planning/cert/${id}`
export const PLANNING_SERVICEID_API = 'https://mocki.io/v1/44f75222-b4b8-411a-9efa-ab7be157d6a6'

// Team Management APIs
export const TEAM_MANAGEMENT_API = 'https://mocki.io/v1/e3b860e2-4bb4-4262-aec5-a8c83abc8ffa'
export const TEAM_CREATE_API = 'http://localhost:7998/api/v1/team'
export const TEAM_UPDATE_API = 'http://localhost:7998/api/v1/team'

// Audit Logs API
export const AUDIT_LOGS_API = 'https://mocki.io/v1/68d0cf10-6ffc-4f81-b3f2-40be0c9fde39'

// Add to existing exports
export const SERVICEID_CREATE_API = '/api/onboard/serviceid'
export const SERVICEID_UPDATE_API = '/api/onboard/serviceid'
export const SERVICEID_DELETE_API = (serviceId: string, environment: string) => `/api/v1/deletserviceid/${serviceId}/${environment}`
