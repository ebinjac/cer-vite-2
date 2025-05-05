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