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
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">
            Managing certificates for <span className="font-medium text-primary">{selectedTeam}</span> team
          </p>
        </div>
        <CertificatesTable 
          data={data || []} 
          isLoading={isLoading} 
          isError={isError} 
          error={error as Error} 
        />
      </div>
    </PageTransition>
  )
}
