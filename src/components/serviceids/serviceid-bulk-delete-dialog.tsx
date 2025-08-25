import * as React from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { ServiceId } from '@/hooks/use-serviceids'
import { SERVICEID_DELETE_API } from '@/lib/api-endpoints'
import { ServiceIdDeletionStatus, type DeletionResult } from './serviceid-deletion-status'

interface BulkDeleteDialogProps {
  serviceIds: ServiceId[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteComplete: () => void
}

export function BulkDeleteDialog({ 
  serviceIds, 
  open, 
  onOpenChange, 
  onDeleteComplete 
}: BulkDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [results, setResults] = React.useState<DeletionResult[]>([])
  const [isCompleted, setIsCompleted] = React.useState(false)
  const totalServiceIds = serviceIds.length

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

  if (!serviceIds.length) return null

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    setError(null)
    setCurrentIndex(0)
    setResults([])
    setIsCompleted(false)

    try {
      let newResults: DeletionResult[] = [];

      // Process service IDs one by one
      for (let i = 0; i < serviceIds.length; i++) {
        const serviceId = serviceIds[i];
        
        if (!serviceId.svcid) {
          newResults.push({
            svcid: serviceId.env || 'Unknown',
            success: false,
            error: 'Service ID missing identifier'
          });
          setResults([...newResults]);
          setCurrentIndex(i + 1);
          continue;
        }

        try {
          const res = await fetch(SERVICEID_DELETE_API(serviceId.svcid, serviceId.env), {
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
            svcid: serviceId.svcid,
            success: res.ok,
            error: !res.ok ? (errorText || `Failed with status: ${res.status}`) : undefined,
            statusCode: res.status
          });
          
          setResults([...newResults]);
          setCurrentIndex(i + 1);
        } catch (err: any) {
          newResults.push({
            svcid: serviceId.svcid,
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
        toast.success(`${successCount} of ${totalServiceIds} service IDs deleted`, {
          description: successCount < totalServiceIds ? 'Some service IDs could not be deleted.' : undefined
        });
      } else {
        toast.error('Failed to delete service IDs', {
          description: 'None of the selected service IDs could be deleted.'
        });
      }
      
      // Only auto-close on complete success
      if (successCount === totalServiceIds) {
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
            Bulk Delete Service IDs
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {!isDeleting && !isCompleted && (
              <p>
                Are you sure you want to delete {serviceIds.length} selected service IDs? This action cannot be undone.
              </p>
            )}
            
            <ServiceIdDeletionStatus
              results={results}
              isCompleted={isCompleted}
              inProgress={isDeleting}
              currentIndex={currentIndex}
              totalCount={totalServiceIds}
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
                `Delete ${serviceIds.length} Service IDs`
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}