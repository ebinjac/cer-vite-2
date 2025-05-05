import { createFileRoute } from '@tanstack/react-router'
import { useServiceIds } from '@/hooks/use-serviceids'
import ServiceIdsTable from '@/components/serviceids/serviceids-table'
import { PageTransition } from '@/components/ui/sidebar'
import { useTeamStore } from '@/store/team-store'

export const Route = createFileRoute('/serviceid')({
  component: ServiceIdsPage,
})

function ServiceIdsPage() {
  const { data, isLoading, isError, error } = useServiceIds()
  const { selectedTeam } = useTeamStore()
  
  return (
    <PageTransition keyId="serviceids">
      <div className="p-6">
        <ServiceIdsTable
          data={data || []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          teamName={selectedTeam}
        />
      </div>
    </PageTransition>
  )
}
