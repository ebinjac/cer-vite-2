import React from 'react'
import { useTeams } from '@/hooks/use-teams'

interface TeamsProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that loads teams data when the application starts
 * This pattern helps with keeping data loading logic separate from UI components
 */
export function TeamsProvider({ children }: TeamsProviderProps) {
  // Load teams data when the component mounts
  // We're not using the returned values directly since this is just for initialization
  useTeams()
  
  // You could add global error UI for team loading failures here if needed
  // This is optional since the TeamSwitcher already handles the loading states
  
  return <>{children}</>
} 