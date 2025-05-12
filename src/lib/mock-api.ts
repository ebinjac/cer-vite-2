// Mock API helper for development
// This simulates API calls with configurable delay and random failures

// Mock teams data
const TEAMS = [
  'CloudSecurity',
  'Data-Certs',
  'Mobile-Team', 
  'Zmainframe-Certs',
  'Fin-Certs'
]

// Configurable settings
const MOCK_API_CONFIG = {
  delay: {
    min: 300,   // minimum delay in ms
    max: 800,   // maximum delay in ms
  },
  failureRate: 0.0  // probability of request failure (0-1)
}

// Helper function to simulate network delay
const simulateDelay = () => {
  const delay = Math.floor(
    Math.random() * (MOCK_API_CONFIG.delay.max - MOCK_API_CONFIG.delay.min) + 
    MOCK_API_CONFIG.delay.min
  )
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Helper function to simulate failure
const shouldFail = () => {
  return Math.random() < MOCK_API_CONFIG.failureRate
}

// Mock teams API
export const fetchTeamsApi = async () => {
  await simulateDelay()
  
  if (shouldFail()) {
    throw new Error('Failed to fetch teams data')
  }
  
  return [...TEAMS]
}

// Export the mock data for testing
export const MOCK_DATA = {
  TEAMS
}

// Mock data for certificate planning
export const MOCK_PLAN_CERTIFICATES = [
  {
    id: 1064497,
    commonName: "apiarenapltfrm.ga.in.americanexpress.com",
    seriatNumber: "fsf124131",
    changeNumber: "CH123235",
    renewalDate: "2025-03-31",
    renewedBy: "amkada",
    currentStatus: "completed",
    validTo: "2024-08-14",
    validFrom: "2023-08-14",
    checklist: "1,1,1,1,1,1,1,1,1,1,1,1",
    underRenewal: false,
    renewingTeamName: "CloudSecurity",
    comment: "",
    zeroTouch: null
  },
  {
    id: 1064498,
    commonName: "paymentgateway.ga.in.americanexpress.com",
    seriatNumber: "abc456789",
    changeNumber: "CH789012",
    renewalDate: "2025-05-15",
    renewedBy: "jsmith",
    currentStatus: "pending",
    validTo: "2024-09-30",
    validFrom: "2023-09-30",
    checklist: "0,0,0,0,0,0,0,0,0,0,0,0",
    underRenewal: false,
    renewingTeamName: "Mobile-Team",
    comment: "",
    zeroTouch: false
  },
  {
    id: 1064499,
    commonName: "customerportal.ga.in.americanexpress.com",
    seriatNumber: "xyz123456",
    changeNumber: "CH456789",
    renewalDate: "2025-04-22",
    renewedBy: "mwilson",
    currentStatus: "continue",
    validTo: "2024-10-15",
    validFrom: "2023-10-15",
    checklist: "1,1,1,0,0,0,0,0,0,0,0,0",
    underRenewal: true,
    renewingTeamName: "Data-Cert",
    comment: "Certificate renewal in progress",
    zeroTouch: false
  },
  {
    id: 1064500,
    commonName: "analyticsservice.ga.in.americanexpress.com",
    seriatNumber: "def987654",
    changeNumber: "CH654321",
    renewalDate: "2025-06-10",
    renewedBy: "rjohnson",
    currentStatus: "completed",
    validTo: "2024-11-05",
    validFrom: "2023-11-05",
    checklist: "1,1,1,1,1,1,1,1,1,1,1,1",
    underRenewal: false,
    renewingTeamName: "Data-Cert",
    comment: "Successfully renewed",
    zeroTouch: true
  },
  {
    id: 1064501,
    commonName: "authservice.ga.in.americanexpress.com",
    seriatNumber: "ghi654321",
    changeNumber: "CH321654",
    renewalDate: "2025-07-18",
    renewedBy: "dthomas",
    currentStatus: "continue",
    validTo: "2024-12-20",
    validFrom: "2023-12-20",
    checklist: "1,1,1,1,1,1,0,0,0,0,0,0",
    underRenewal: true,
    renewingTeamName: "auth-services",
    comment: "Halfway through renewal process",
    zeroTouch: false
  }
];

// Deep clone data to prevent reference issues
const cloneData = <T>(data: T): T => JSON.parse(JSON.stringify(data))

// Mock certificate planning API
export const fetchPlanCertificatesApi = async (teamName?: string) => {
  await simulateDelay()
  
  if (shouldFail()) {
    throw new Error('Failed to fetch certificate planning data')
  }
  
  let data = cloneData(MOCK_PLAN_CERTIFICATES)
  
  // Filter by team if provided
  if (teamName) {
    data = data.filter(cert => cert.renewingTeamName.toLowerCase() === teamName.toLowerCase())
  }
  
  return data
}

// Mock update certificate planning API
export const updatePlanCertificateApi = async (id: number, updates: any) => {
  await simulateDelay()
  
  if (shouldFail()) {
    throw new Error('Failed to update certificate planning data')
  }
  
  // Find the certificate in mock data
  const certIndex = MOCK_PLAN_CERTIFICATES.findIndex(cert => cert.id === id)
  
  if (certIndex === -1) {
    throw new Error(`Certificate with ID ${id} not found`)
  }
  
  // Update the certificate in our mock data
  MOCK_PLAN_CERTIFICATES[certIndex] = {
    ...MOCK_PLAN_CERTIFICATES[certIndex],
    ...updates
  }
  
  return { success: true, data: MOCK_PLAN_CERTIFICATES[certIndex] }
} 