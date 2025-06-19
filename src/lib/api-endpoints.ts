// Centralized API endpoints for all services
// Update these values to change API URLs in one place

export const CERT_API = 'http://localhost:8008/api/v1/certificates'
export const SERVICEID_API = 'http://localhost:8008/api/v1/serviceid'
export const CERTIFICATE_SAVE_API = 'http://localhost:5000/api/v2/certificate/savetodb'
export const CERTIFICATE_UPDATE_API = '/api/v1/updatecert'
export const CERTIFICATE_RENEW_API = '/api/v1/renewal'
export const CERTIFICATE_DELETE_API = (commonName: string) => `/api/v1/deletecert/${commonName}`
export const CERTIFICATE_SEARCH_API = (commonName: string) => `/api/v1/searchcertificate/${commonName}`
// export const APPLICATION_LIST_API = (teamName: string) => `/api/v1/contact/applist/${teamName}`
export const APPLICATION_LIST_API = (teamName: string) => `http://localhost:8008/v1/applist`
export const APPLICATION_LIST_API_SERVICEID = (teamName: string) => `http://localhost:8008/v1/applist`
export const TEAMS_API = 'http://localhost:8008/api/v1/teams'
export const PLANNING_CERTIFICATE_API = 'http://localhost:8008/api/v1/certrenewal'
export const PLANNING_CERTIFICATE_UPDATE_API = (id: number) => `/api/v1/planning/cert/${id}`
export const PLANNING_SERVICEID_API = 'http://localhost:8008/api/v1/serviceidrenewal'

// Team Management APIs
export const TEAM_MANAGEMENT_API = 'http://localhost:8008/api/v1/teamsmanagement'
export const TEAM_CREATE_API = 'http://localhost:8008/addteam'
export const TEAM_UPDATE_API = 'http://localhost:8008/addteamput'

// Audit Logs API
export const AUDIT_LOGS_API = 'http://localhost:8008/api/v1/auditlogs'

// Add to existing exports
export const SERVICEID_CREATE_API = '/api/onboard/serviceid'
export const SERVICEID_UPDATE_API = '/api/onboard/serviceid'
export const SERVICEID_DELETE_API = (serviceId: string, environment: string) => `/api/v1/deletserviceid/${serviceId}/${environment}`
export const SERVICEID_RENEW_API = '/api/v1/planning/svc'