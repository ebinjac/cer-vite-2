import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CertificatesTable } from '@/components/planning/certificates-table'
import { ServiceIdTab } from '@/components/planning/service-id-tab'
import { usePlanCertificates } from '@/hooks/use-plan-certificates'
import { ShieldCheck, ServerCog } from 'lucide-react'

export const Route = createFileRoute('/planning')({
  component: PlanningPage,
})

function PlanningPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    parseChecklist,
    updateCertificateChecklist
  } = usePlanCertificates()

  return (
    <div className="container max-w-full px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Planning</h1>
      </div>
      
      <Tabs defaultValue="certificate-renewal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="certificate-renewal" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Certificate Renewal</span>
          </TabsTrigger>
          <TabsTrigger value="service-id" className="flex items-center gap-2">
            <ServerCog className="h-4 w-4" />
            <span>Service ID</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="certificate-renewal" className="mt-0 w-full">
          <CertificatesTable 
            data={data}
            isLoading={isLoading}
            isError={isError}
            error={error}
            parseChecklist={parseChecklist}
            updateCertificateChecklist={updateCertificateChecklist}
          />
        </TabsContent>
        <TabsContent value="service-id" className="mt-0 w-full">
          <ServiceIdTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
