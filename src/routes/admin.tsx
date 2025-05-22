"use client"

import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTeamManagement, useCreateTeam, useUpdateTeam, type TeamManagement } from '@/hooks/use-team-management'
import { TeamsTable } from '@/components/admin/teams-table'
import { TeamForm } from '@/components/admin/team-form'
import { TeamsDashboard } from '@/components/admin/teams-dashboard'
import { AuditLogs } from '@/components/admin/audit-logs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PageTransition } from '@/components/ui/sidebar'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { data: teams, isLoading, isError, error } = useTeamManagement()
  const { mutateAsync: createTeam, isPending: isCreating } = useCreateTeam()
  const { mutateAsync: updateTeam, isPending: isUpdating } = useUpdateTeam()
  const [selectedTeam, setSelectedTeam] = React.useState<TeamManagement | undefined>()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null!)

  const handleCreate = () => {
    setSelectedTeam(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (team: TeamManagement) => {
    setSelectedTeam(team)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedTeam) {
        await updateTeam(data)
        toast.success("Team Updated", {
          description: "The team has been updated successfully."
        })
      } else {
        await createTeam(data)
        toast.success("Team Created", {
          description: "The team has been created successfully."
        })
      }
      setIsDialogOpen(false)
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl min-w-[700px] h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="px-6 py-4 flex-none">
              <DialogTitle>{selectedTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
              <DialogDescription>
                {selectedTeam 
                  ? 'Edit the team details below.' 
                  : 'Fill in the team details below to create a new team.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-6 py-4">
                <TeamForm
                  initialData={selectedTeam}
                  onSubmit={handleSubmit}
                  isSubmitting={isCreating || isUpdating}
                  formRef={formRef}
                  hideSubmitButton
                />
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t flex-none">
              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
                onClick={() => {
                  if (formRef.current) {
                    formRef.current.requestSubmit()
                  }
                }}
              >
                {isCreating || isUpdating ? "Saving..." : selectedTeam ? "Update Team" : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
