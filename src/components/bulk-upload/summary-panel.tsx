import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { UploadStatus } from '@/hooks/use-bulk-upload'

type Props = {
  statuses: UploadStatus[]
  onUploadAnother: () => void
  onViewDetails?: () => void
}

export function SummaryPanel({ statuses, onUploadAnother, onViewDetails }: Props) {
  const hasErrors = statuses.some(s => s.status === 'error')
  const successCount = statuses.filter(s => s.status === 'success').length

  return (
    <div className="rounded-lg bg-card border p-8">
      <div className="flex items-center gap-4 mb-6">
        {hasErrors ? (
          <div className="bg-destructive/10 rounded-full p-3">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
        ) : (
          <div className="bg-green-50 rounded-full p-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-semibold">Upload Complete</h2>
          <p className="text-muted-foreground">
            {hasErrors ? 'Some items failed to upload' : 'All items were uploaded successfully'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Successful Uploads</h3>
          </div>
          <p className="text-2xl font-semibold text-green-700">
            {successCount}
            <span className="text-base text-green-600 font-normal"> of {statuses.length}</span>
          </p>
        </div>

        {hasErrors && (
          <div className="rounded-lg bg-destructive/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-medium">Failed Uploads</h3>
            </div>
            <p className="text-2xl font-semibold text-destructive">
              {statuses.filter(s => s.status === 'error').length}
              <span className="text-base text-destructive/80 font-normal"> of {statuses.length}</span>
            </p>
          </div>
        )}
      </div>

      {hasErrors && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Error Details</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {statuses.map((status, index) => (
              status.status === 'error' && (
                <div key={index} className="bg-destructive/5 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Row {index + 2}</p>
                      <p className="text-sm text-destructive/90 whitespace-pre-wrap break-words">
                        {status.message}
                      </p>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onUploadAnother}>Upload Another File</Button>
        {hasErrors && onViewDetails && (
          <Button variant="outline" onClick={onViewDetails}>View Upload Details</Button>
        )}
      </div>
    </div>
  )
}
