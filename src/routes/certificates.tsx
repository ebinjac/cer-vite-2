import { createFileRoute } from '@tanstack/react-router'
import { PageTransition } from '@/components/ui/sidebar'
import { CertificatesTable } from '@/components/certificates/certificates-table'
import { useCertificates } from '@/hooks/use-certificates'
import { useTeamStore } from '@/store/team-store'

export const Route = createFileRoute('/certificates')({
  component: CertificatesPage,
})

function CertificatesPage() {
  const { data, isLoading, isError, error } = useCertificates()
  const { selectedTeam } = useTeamStore()
  
  return (
    <PageTransition keyId="certificates">
      <div className="p-6">
        <CertificatesTable 
          data={data || []} 
          isLoading={isLoading} 
          isError={isError} 
          error={error as Error} 
          teamName={selectedTeam}
        />
      </div>
    </PageTransition>
  )
}
