import * as React from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { CertificateUpdateDrawerForm } from './certificate-update-drawer-form'
import type { Certificate } from '@/hooks/use-certificates'

interface CertificateUpdateDrawerProps {
  certificate: Certificate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCertificateUpdated?: () => void
}

export function CertificateUpdateDrawer({
  certificate,
  open,
  onOpenChange,
  onCertificateUpdated
}: CertificateUpdateDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-[100dvh] max-w-[90vw] md:min-w-[750px] flex flex-col p-0">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle>Update Certificate</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-auto">
          <CertificateUpdateDrawerForm 
            certificate={certificate} 
            onSuccess={() => onOpenChange(false)}
            onCertificateUpdated={onCertificateUpdated}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
} 