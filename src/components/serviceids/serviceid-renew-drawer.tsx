import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerPortal, DrawerOverlay, DrawerClose } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ServiceIdRenewForm } from '@/components/serviceids/serviceid-renew-form'
import type { ServiceId } from '@/hooks/use-serviceids'

interface ServiceIdRenewDrawerProps {
  serviceId: ServiceId | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceIdRenewed?: () => void
}

export function ServiceIdRenewDrawer({
  serviceId,
  open,
  onOpenChange,
  onServiceIdRenewed
}: ServiceIdRenewDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="min-w-[750px] ml-auto h-full">
          <DrawerHeader className="border-b relative">
            <DrawerTitle>Renew Service ID</DrawerTitle>
            <DrawerClose className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 h-[calc(100vh-4rem)]">
            <div className="p-4">
              <Tabs defaultValue="no-planning" className="w-full">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="no-planning">Without Planning</TabsTrigger>
                  <TabsTrigger value="with-planning">With Planning</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="no-planning" className="mt-0">
                <ServiceIdRenewForm 
                  serviceId={serviceId} 
                  onSuccess={() => onOpenChange(false)}
                  onServiceIdRenewed={onServiceIdRenewed}
                  withPlanning={false}
                />
              </TabsContent>
              
              <TabsContent value="with-planning" className="mt-0">
                <ServiceIdRenewForm 
                  serviceId={serviceId} 
                  onSuccess={() => onOpenChange(false)}
                  onServiceIdRenewed={onServiceIdRenewed}
                  withPlanning={true}
                />
              </TabsContent>
              </Tabs>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  )
}