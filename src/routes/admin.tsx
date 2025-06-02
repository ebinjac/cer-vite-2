"use client"

import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTeamManagement, useCreateTeam, useUpdateTeam, type TeamManagement } from '@/hooks/use-team-management'
import { TeamsTable } from '@/components/admin/teams-table'
import { TeamsDashboard } from '@/components/admin/teams-dashboard'
import { AuditLogs } from '@/components/admin/audit-logs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PageTransition } from '@/components/ui/sidebar'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { data: teams, isLoading, isError, error } = useTeamManagement()
  const { mutateAsync: createTeam } = useCreateTeam()
  const { mutateAsync: updateTeam } = useUpdateTeam()

  const handleCreate = async (data: TeamManagement) => {
    try {
      await createTeam(data)
      toast.success("Team Created", {
        description: "The team has been created successfully."
      })
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred. Please try again."
      })
    }
  }

  const handleEdit = async (data: TeamManagement) => {
    try {
      console.log('Admin - Update Data (before API call):', data)
      await updateTeam(data)
      toast.success("Team Updated", {
        description: "The team has been updated successfully."
      })
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred. Please try again."
      })
    }
  }

  return (
    <PageTransition keyId="admin">
      <div className="p-6 space-y-6">
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <TeamsDashboard />
            <TeamsTable 
              data={teams || []}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onEdit={handleEdit}
              onAdd={handleCreate}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
