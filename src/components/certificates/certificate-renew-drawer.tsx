
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CertificateRenewForm } from '@/components/certificates/certificate-renew-form'
import type { Certificate } from '@/hooks/use-certificates'

interface CertificateRenewDrawerProps {
  certificate: Certificate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCertificateRenewed?: () => void
}

export function CertificateRenewDrawer({
  certificate,
  open,
  onOpenChange,
  onCertificateRenewed
}: CertificateRenewDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-[100dvh] max-w-[90vw] md:min-w-[900px] flex flex-col p-0">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle>Renew Certificate</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="no-planning" className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="no-planning">Without Planning</TabsTrigger>
                <TabsTrigger value="with-planning">With Planning</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="no-planning" className="mt-0">
              <CertificateRenewForm 
                certificate={certificate} 
                onSuccess={() => onOpenChange(false)}
                onCertificateRenewed={onCertificateRenewed}
                withPlanning={false}
              />
            </TabsContent>
            
            <TabsContent value="with-planning" className="mt-0">
              <CertificateRenewForm 
                certificate={certificate} 
                onSuccess={() => onOpenChange(false)}
                onCertificateRenewed={onCertificateRenewed}
                withPlanning={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 