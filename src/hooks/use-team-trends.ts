import { useEffect } from 'react'
import type { TeamManagement } from './use-team-management'

interface TeamStats {
  totalTeams: number
  certificateTeams: number
  serviceIdTeams: number
  totalApplications: number
  timestamp: number
}

interface TeamTrends {
  current: TeamStats
  previous: TeamStats | null
}

const TRENDS_STORAGE_KEY = 'team-trends'
const TREND_UPDATE_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

function calculateStats(teams: TeamManagement[]): TeamStats {
  const totalTeams = teams.length
  const certificateTeams = teams.filter(team => team.functionHandled === 'certificate').length
  const serviceIdTeams = teams.filter(team => team.functionHandled === 'serviceid').length
  const totalApplications = teams.reduce((acc, team) => {
    const apps = team.listOfApplicationNames.split(',').filter(Boolean).length
    return acc + apps
  }, 0)

  return {
    totalTeams,
    certificateTeams,
    serviceIdTeams,
    totalApplications,
    timestamp: Date.now()
  }
}

function calculateTrend(current: number, previous: number | null): { value: number; isPositive: boolean } | undefined {
  if (previous === null) return undefined

  const difference = current - previous
  const percentageChange = Math.round((difference / previous) * 100)

  return {
    value: Math.abs(percentageChange),
    isPositive: percentageChange > 0
  }
}

export function useTeamTrends(teams: TeamManagement[] | undefined) {
  useEffect(() => {
    if (!teams) return

    // Load existing trends
    const storedTrends = localStorage.getItem(TRENDS_STORAGE_KEY)
    let trends: TeamTrends | null = storedTrends ? JSON.parse(storedTrends) : null

    // Calculate current stats
    const currentStats = calculateStats(teams)

    // Check if we need to update trends
    if (!trends || (Date.now() - trends.current.timestamp) >= TREND_UPDATE_INTERVAL) {
      // Store current stats as new trend data
      trends = {
        current: currentStats,
        previous: trends?.current || null
      }
      localStorage.setItem(TRENDS_STORAGE_KEY, JSON.stringify(trends))
    }
  }, [teams])

  if (!teams) return null

  // Calculate current stats
  const currentStats = calculateStats(teams)

  // Load stored trends
  const storedTrends = localStorage.getItem(TRENDS_STORAGE_KEY)
  const trends: TeamTrends | null = storedTrends ? JSON.parse(storedTrends) : null

  // Calculate trends
  return {
    totalTeams: {
      value: currentStats.totalTeams,
      trend: trends?.previous ? calculateTrend(currentStats.totalTeams, trends.previous.totalTeams) : undefined
    },
    certificateTeams: {
      value: currentStats.certificateTeams,
      trend: trends?.previous ? calculateTrend(currentStats.certificateTeams, trends.previous.certificateTeams) : undefined
    },
    serviceIdTeams: {
      value: currentStats.serviceIdTeams,
      trend: trends?.previous ? calculateTrend(currentStats.serviceIdTeams, trends.previous.serviceIdTeams) : undefined
    },
    totalApplications: {
      value: currentStats.totalApplications,
      trend: trends?.previous ? calculateTrend(currentStats.totalApplications, trends.previous.totalApplications) : undefined
    }
  }
} 