// features/service-ids/BulkServiceIdUpload.tsx
import * as React from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/store/team-store'
import { useQueryClient } from '@tanstack/react-query'
import { BulkUploadWizard } from '@/components/bulk-upload/bulk-upload-wizard'
import { useBulkUpload } from '@/hooks/use-bulk-upload'
import { useApplications } from '@/hooks/use-applications'
import { useApiMutation } from '@/hooks/use-mutation-api'
import { parseCsv } from '@/lib/csv'
import { SERVICEID_CREATE_API } from '@/lib/api-endpoints'
import {
  SERVICEID_FIELDS,
  guardServiceIdHeaders,
  validateServiceIdRow,
} from '@/lib/validators/serviceids'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function downloadCsvTemplate(fields: string[], filename: string) {
  const csv = fields.join(',') + '\n'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function BulkServiceIdUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const { selectedTeam } = useTeamStore()
  const queryClient = useQueryClient()

  // React Query: applications list
  const { apps, error: appError } = useApplications(selectedTeam)

  // React Query: row upload mutation
  const svcMutation = useApiMutation<any>(SERVICEID_CREATE_API)

  const {
    validation,
    uploading,
    processing,
    showSummary,
    hasCompletedProcessing,
    uploadStatus,
    uploadProgress,
    previews,
    reset,
    validateFile,
    startUpload,
  } = useBulkUpload<{}>({
    parseCsv,                  // supports comma or tab
    headersGuard: guardServiceIdHeaders,
    validateRow: (row) => validateServiceIdRow(row, apps),
    buildPayload: (row) => ({
      svcid: row.svcid,
      env: row.env?.toUpperCase(),
      application: row.application,
      expDate: row.expDate,
      renewalProcess: row.renewalProcess,
      comment: row.comment || '',
      renewingTeamName: selectedTeam,
    }),
    uploadRow: async (payload) => { await svcMutation.mutateAsync(payload) },
    getPreview: (row, headers) => ({
      primary: row[headers.indexOf('svcid')] || '',
      secondary: row[headers.indexOf('application')] || '',
    }),
  })

  const [file, setFile] = React.useState<File | null>(null)

  const onValidate = React.useCallback(async (f: File) => {
    const result = await validateFile(f)
    if (!result) return
    if (result.invalid === 0 && result.valid > 0) {
      toast.success('CSV validated successfully!')
    } else if (result.invalid > 0) {
      toast.error('Some rows have errors. Please fix and re-upload.')
    }
    return result
  }, [validateFile])

  const onAllSuccess = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['serviceids'] })
    onUploadSuccess?.()
  }, [onUploadSuccess, queryClient])

  return (
    <BulkUploadWizard
      validation={validation}
      uploading={uploading}
      processing={processing}
      showSummary={showSummary}
      hasCompletedProcessing={hasCompletedProcessing}
      uploadStatus={uploadStatus}
      uploadProgress={uploadProgress}
      previews={previews}
      onValidate={onValidate}
      onStartUpload={startUpload}
      onReset={reset}
      maxSize={MAX_SIZE}
      accept=".csv"
      steps={[
        { step: 1, title: 'Select File', description: 'Upload your CSV file' },
        { step: 2, title: 'Validation', description: 'Review validation results' },
        { step: 3, title: 'Processing', description: 'Upload service IDs' },
        { step: 4, title: 'Complete', description: 'View upload status' },
      ]}
      processingTitle="Uploading Service IDs"
      header={
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold mb-2">Bulk Upload Service IDs</h2>
          <div className="text-sm text-muted-foreground mb-4">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Download the CSV template for Service IDs.</li>
              <li>Fill in all required fields. <span className="font-medium">Do not change the header row.</span></li>
              <li>Environment must be E1, E2, or E3. Expiry date must be YYYY-MM-DD.</li>
            </ol>
          </div>
          <Button
            variant="outline"
            onClick={() => downloadCsvTemplate([...SERVICEID_FIELDS], 'serviceid-template.csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Service ID CSV Template
          </Button>
          {appError && (
            <div className="bg-destructive/10 rounded-lg p-4 mt-4">
              <p className="text-sm text-destructive">
                Warning: {appError}. Application name validation will be skipped.
              </p>
            </div>
          )}
        </div>
      }
      file={file}
      setFile={setFile}
      onAllSuccess={onAllSuccess}
    />
  )
}
