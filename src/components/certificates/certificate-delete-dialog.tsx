import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Certificate } from '@/hooks/use-certificates'
import { CERTIFICATE_DELETE_API } from '@/lib/api-endpoints'

interface CertificateDeleteDialogProps {
  certificate: Certificate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCertificateDeleted?: () => void
}

export function CertificateDeleteDialog({
  certificate,
  open,
  onOpenChange,
  onCertificateDeleted
}: CertificateDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset error when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setError(null)
      setIsDeleting(false)
    }
  }, [open])

  if (!certificate) return null

  const handleDelete = async () => {
    if (!certificate.commonName) {
      setError('Certificate common name is missing')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch(CERTIFICATE_DELETE_API(certificate.commonName), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        let errorText = ''
        try {
          errorText = await res.text()
        } catch {}
        throw new Error(errorText || `Failed to delete certificate: ${res.status} ${res.statusText}`)
      }

      toast.success('Certificate deleted successfully', {
        description: `The certificate "${certificate.commonName}" has been deleted.`
      })

      // Close the dialog
      onOpenChange(false)
      
      // Notify parent component to refresh data
      if (onCertificateDeleted) {
        onCertificateDeleted()
      }
    } catch (err: any) {
      let message = 'An error occurred while deleting the certificate.'
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.'
      } else if (err?.message) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Certificate
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete this certificate? This action cannot be undone.
            </p>
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="text-sm font-medium">Common Name:</span>
                  <span className="text-sm font-semibold">{certificate.commonName}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="text-sm font-medium">Serial Number:</span>
                  <span className="text-sm font-mono">{certificate.serialNumber}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="outline" className="w-fit">
                    {certificate.certificateStatus}
                  </Badge>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Certificate'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 