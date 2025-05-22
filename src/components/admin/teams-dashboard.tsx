import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTeamManagement } from '@/hooks/use-team-management'
import { useTeamTrends } from '@/hooks/use-team-trends'
import { motion } from 'framer-motion'
import { Users2, ShieldCheck, Key, AppWindow } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </motion.div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

export function TeamsDashboard() {
  const { data: teams, isLoading } = useTeamManagement()
  const trends = useTeamTrends(teams)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!teams || !trends) return null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Teams"
          value={trends.totalTeams.value}
          description="Total number of teams in the system"
          icon={<Users2 className="h-4 w-4 text-muted-foreground" />}
          trend={trends.totalTeams.trend}
        />
        <StatCard
          title="Certificate Teams"
          value={trends.certificateTeams.value}
          description="Teams handling certificates"
          icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
          trend={trends.certificateTeams.trend}
        />
        <StatCard
          title="Service ID Teams"
          value={trends.serviceIdTeams.value}
          description="Teams handling service IDs"
          icon={<Key className="h-4 w-4 text-muted-foreground" />}
          trend={trends.serviceIdTeams.trend}
        />
        <StatCard
          title="Total Applications"
          value={trends.totalApplications.value}
          description="Total applications managed"
          icon={<AppWindow className="h-4 w-4 text-muted-foreground" />}
          trend={trends.totalApplications.trend}
        />
      </div>
    </div>
  )
} 