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