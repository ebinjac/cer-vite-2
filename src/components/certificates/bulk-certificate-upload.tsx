// features/certificates/BulkCertificateUpload.tsx
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
import { parseCsv as parseCsvBase } from '@/lib/csv'
import { CERTIFICATE_SAVE_API } from '@/lib/api-endpoints'
import {
  CERT_FIELDS,
  detectTemplate,
  validateCertificateRow,
  type CertContext,
} from '@/lib/validators/certificates'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

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

export function BulkCertificateUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const { selectedTeam } = useTeamStore()
  const queryClient = useQueryClient()

  const { apps, error: appError } = useApplications(selectedTeam)
  const certMutation = useApiMutation<any>(CERTIFICATE_SAVE_API)
  const parseCsv = React.useCallback((text: string) => parseCsvBase(text, true), [])

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
  } = useBulkUpload<CertContext>({
    parseCsv,
    headersGuard: (headers) => {
      const ctx = detectTemplate(headers)
      return ctx ? { ok: true as const, ctx } : { ok: false as const, error: 'Invalid CSV template headers' }
    },
    validateRow: (row, ctx) => validateCertificateRow(row, ctx, apps),
    buildPayload: (row, ctx) => {
      const payload: Record<string, any> = {
        commonName: row.commonName ?? '',
        serialNumber: row.serialNumber ?? '',
        centralID: row.centralID ?? '',
        applicationName: row.applicationName ?? '',
        isAmexCert: ctx.isAmex ? 'Yes' : 'No',
        validTo: ctx.isAmex ? '' : (row.validTo ?? ''),
        environment: ctx.isAmex ? '' : (row.environment ?? ''),
        comment: row.comment ?? '',
        serverName: row.serverName ?? '',
        keystorePath: row.keystorePath ?? '',
        uri: row.uri ?? '',
        renewingTeamName: selectedTeam || '',
      }
      return payload
    },
    uploadRow: async (payload) => { await certMutation.mutateAsync(payload) },
    getPreview: (row, headers) => ({
      primary: row[headers.indexOf('commonName')] || '',
      secondary: row[headers.indexOf('applicationName')] || '',
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
    queryClient.invalidateQueries({ queryKey: ['certificates'] })
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
        { step: 3, title: 'Processing', description: 'Upload certificates' },
        { step: 4, title: 'Complete', description: 'View upload status' },
      ]}
      processingTitle="Uploading Certificates"
      header={
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold mb-2">Select Certificate CSV File</h2>
          <div className="text-sm text-muted-foreground mb-4">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Download the appropriate CSV template for your certificate type.</li>
              <li>Fill in all required fields. <span className="font-medium">Do not change the header row.</span></li>
              <li>For <span className="font-semibold">Non Amex</span> certificates, the <span className="font-mono">validTo</span> date must be in exact format <span className="font-mono">YYYY-MM-DD</span> (e.g., <span className="font-mono">2025-05-19</span>).</li>
              <li>Application name must match one from your team's application list.</li>
            </ol>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Button
              variant="outline"
              onClick={() => downloadCsvTemplate([...CERT_FIELDS.AMEX_FIELDS], 'amex-cert-template.csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Amex Cert CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadCsvTemplate([...CERT_FIELDS.NON_AMEX_FIELDS], 'non-amex-cert-template.csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Non Amex Cert CSV
            </Button>
          </div>
          {appError && (
            <div className="bg-destructive/10 rounded-lg p-4 mb-4">
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
