// Centralized API endpoints for all services
// Update these values to change API URLs in one place

export const CERT_API = 'https://mocki.io/v1/628243bc-9d5f-4708-b4e5-9fd53c486bae'
export const SERVICEID_API = 'https://mocki.io/v1/3fe73122-007d-4c9b-9b4d-aee79deb1f80'
export const CERTIFICATE_SAVE_API = 'http://localhost:5000/api/v2/certificate/savetodb'
export const APPLICATION_LIST_API = (teamName: string) => `/api/v1/contact/applist/${teamName}`
export const TEAMS_API = '/api/v1/teams' 