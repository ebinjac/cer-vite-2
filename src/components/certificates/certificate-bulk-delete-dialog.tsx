import * as React from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { Certificate } from '@/hooks/use-certificates'
import { CERTIFICATE_DELETE_API } from '@/lib/api-endpoints'
import { CertificateDeletionStatus, type DeletionResult } from './certificate-deletion-status'

interface BulkDeleteDialogProps {
  certificates: Certificate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteComplete: () => void
}

export function BulkDeleteDialog({ 
  certificates, 
  open, 
  onOpenChange, 
  onDeleteComplete 
}: BulkDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [results, setResults] = React.useState<DeletionResult[]>([])
  const [isCompleted, setIsCompleted] = React.useState(false)
  const totalCertificates = certificates.length

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setError(null)
      setIsDeleting(false)
      setCurrentIndex(0)
      setResults([])
      setIsCompleted(false)
    }
  }, [open])

  if (!certificates.length) return null

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    setError(null)
    setCurrentIndex(0)
    setResults([])
    setIsCompleted(false)

    try {
      let newResults: DeletionResult[] = [];

      // Process certificates one by one
      for (let i = 0; i < certificates.length; i++) {
        const certificate = certificates[i];
        
        if (!certificate.commonName) {
          newResults.push({
            commonName: certificate.serialNumber || 'Unknown',
            success: false,
            error: 'Certificate missing common name'
          });
          setResults([...newResults]);
          setCurrentIndex(i + 1);
          continue;
        }

        try {
          const res = await fetch(CERTIFICATE_DELETE_API(certificate.commonName), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          let errorText = '';
          if (!res.ok) {
            try {
              errorText = await res.text();
            } catch {}
          }

          newResults.push({
            commonName: certificate.commonName,
            success: res.ok,
            error: !res.ok ? (errorText || `Failed with status: ${res.status}`) : undefined,
            statusCode: res.status
          });
          
          setResults([...newResults]);
          setCurrentIndex(i + 1);
        } catch (err: any) {
          newResults.push({
            commonName: certificate.commonName,
            success: false,
            error: err?.message || 'Network error occurred'
          });
          setResults([...newResults]);
          setCurrentIndex(i + 1);
        }
      }

      setIsCompleted(true);
      
      // Show summary toast
      const successCount = newResults.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} of ${totalCertificates} certificates deleted`, {
          description: successCount < totalCertificates ? 'Some certificates could not be deleted.' : undefined
        });
      } else {
        toast.error('Failed to delete certificates', {
          description: 'None of the selected certificates could be deleted.'
        });
      }
      
      // Only auto-close on complete success
      if (successCount === totalCertificates) {
        setTimeout(() => {
          onOpenChange(false);
          onDeleteComplete();
        }, 1500);
      }
    } catch (err: any) {
      let message = 'An error occurred during bulk deletion.';
      if (err?.message) {
        message = err.message;
      }
      setError(message);
      setIsCompleted(true);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if not actively deleting
      if (!isDeleting) {
        onOpenChange(isOpen);
        if (!isOpen && isCompleted) {
          onDeleteComplete();
        }
      }
    }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bulk Delete Certificates
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {!isDeleting && !isCompleted && (
              <p>
                Are you sure you want to delete {certificates.length} selected certificates? This action cannot be undone.
              </p>
            )}
            
            <CertificateDeletionStatus
              results={results}
              isCompleted={isCompleted}
              inProgress={isDeleting}
              currentIndex={currentIndex}
              totalCount={totalCertificates}
            />
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {isCompleted ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {!isCompleted && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${certificates.length} Certificates`
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}