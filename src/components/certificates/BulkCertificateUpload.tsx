import * as React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, UploadCloud, CheckCircle2, XCircle, PaperclipIcon, AlertCircleIcon, XIcon } from 'lucide-react'
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload'
import type { FileWithPreview } from '@/hooks/use-file-upload'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'


const AMEX_FIELDS = [
  'commonName',
  'serialNumber',
  'centralID',
  'applicationName',
  'comment',
  'serverName',
  'keystorePath',
  'uri',
]

const NON_AMEX_FIELDS = [
  'commonName',
  'serialNumber',
  'centralID',
  'applicationName',
  'validTo',
  'environment',
  'comment',
  'serverName',
  'keystorePath',
  'uri',
]

const ENV_OPTIONS = ['E1', 'E2', 'E3']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function downloadCsvTemplate (fields: string[], filename: string) {
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

function parseCsv (text: string): { headers: string[], rows: string[][] } {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1)
    .map(line => line.split(',').map(cell => cell.trim()))
    .filter(rowArr => rowArr.some(cell => cell && cell.trim() !== '')) // skip all-empty rows
  return { headers, rows }
}

function validateRow (row: Record<string, string>, isAmex: boolean): string[] {
  const errors: string[] = []
  // Common required fields
  for (const field of ['commonName', 'serialNumber', 'centralID', 'applicationName']) {
    if (!row[field]) errors.push(`${field} is required`)
  }
  if (isAmex) {
    // Amex: validTo/environment must be empty
    if (row.validTo) errors.push('validTo must be empty for Amex cert')
    if (row.environment) errors.push('environment must be empty for Amex cert')
  } else {
    // Non Amex: validTo/environment required
    if (!row.validTo) errors.push('validTo is required for Non Amex cert')
    if (!row.environment) errors.push('environment is required for Non Amex cert')
    else if (!ENV_OPTIONS.includes(row.environment)) errors.push('environment must be E1, E2, or E3')
    // Validate validTo as date
    if (row.validTo && isNaN(Date.parse(row.validTo))) errors.push('validTo must be a valid date (YYYY-MM-DD)')
  }
  return errors
}

export function BulkCertificateUpload ({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [validationResults, setValidationResults] = React.useState<null | { valid: number, invalid: number, errors: string[][] }> (null)
  const [processing, setProcessing] = React.useState(false)
  const [
    { files, isDragging, errors: fileErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxSize: MAX_SIZE,
    accept: '.csv',
    multiple: false,
    onFilesChange: async (files: FileWithPreview[]) => {
      setValidationResults(null)
      if (!files.length) return
      setProcessing(true)
      try {
        const file = files[0]?.file as File
        const text = await file.text()
        const { headers, rows } = parseCsv(text)
        // Determine template type by headers
        const isAmex = headers.length === AMEX_FIELDS.length && AMEX_FIELDS.every((f, i) => headers[i] === f)
        const isNonAmex = headers.length === NON_AMEX_FIELDS.length && NON_AMEX_FIELDS.every((f, i) => headers[i] === f)
        if (!isAmex && !isNonAmex) {
          setValidationResults({ valid: 0, invalid: rows.length, errors: rows.map(() => ['Invalid CSV template headers']) })
          setProcessing(false)
          return
        }
        const errors: string[][] = []
        let valid = 0
        let invalid = 0
        for (const rowArr of rows) {
          const row: Record<string, string> = {}
          headers.forEach((h, i) => { row[h] = rowArr[i] || '' })
          const rowErrors = validateRow(row, isAmex)
          if (rowErrors.length) {
            errors.push(rowErrors)
            invalid++
          } else {
            errors.push([])
            valid++
          }
        }
        setValidationResults({ valid, invalid, errors })
        if (invalid === 0 && valid > 0) {
          toast.success('CSV validated successfully!')
          if (onUploadSuccess) onUploadSuccess()
        } else if (invalid > 0) {
          toast.error('Some rows have errors. Please fix and re-upload.')
        }
      } catch (err) {
        toast.error('Failed to read or parse CSV file.')
      } finally {
        setProcessing(false)
      }
    },
  })

  const file = files[0]

  return (
    <div className="w-full my-8 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Bulk Certificate Upload</h2>
        <div className="text-sm text-muted-foreground mb-4">
          <ol className="list-decimal ml-5 space-y-1">
            <li>Download the appropriate CSV template for your certificate type.</li>
            <li>Fill in all required fields. <span className="font-medium">Do not change the header row.</span></li>
            <li>For <span className="font-semibold">Non Amex</span> certificates, the <span className="font-mono">validTo</span> date must be in <span className="font-mono">YYYY-MM-DD</span> format (e.g., <span className="font-mono">2024-12-31</span>).</li>
            <li>Upload the completed CSV file below.</li>
            <li>All rows will be validated before upload. Errors will be shown inline.</li>
          </ol>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Button variant="outline" onClick={() => downloadCsvTemplate(AMEX_FIELDS, 'amex-cert-template.csv')} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Amex Cert CSV
          </Button>
          <Button variant="outline" onClick={() => downloadCsvTemplate(NON_AMEX_FIELDS, 'non-amex-cert-template.csv')} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Non Amex Cert CSV
          </Button>
        </div>
      </div>
      {/* Drag-and-drop uploader */}
      <div
        role="button"
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px] mb-4"
      >
        <input
          {...getInputProps({ accept: '.csv', multiple: false })}
          className="sr-only"
          aria-label="Upload file"
          disabled={Boolean(file)}
        />
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <UploadCloud className="size-4 opacity-60" />
          </div>
          <p className="mb-1.5 text-sm font-medium">Upload CSV file</p>
          <p className="text-muted-foreground text-xs">
            Drag & drop or click to browse (max. {formatBytes(MAX_SIZE)})
          </p>
        </div>
      </div>
      {fileErrors.length > 0 && (
        <div className="text-destructive flex items-center gap-1 text-xs mb-2" role="alert">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{fileErrors[0]}</span>
        </div>
      )}
      {/* File list */}
      {file && (
        <div className="space-y-2 mb-4">
          <div
            key={file.id}
            className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <PaperclipIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{file.file.name}</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
              onClick={() => removeFile(file.id)}
              aria-label="Remove file"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
      {/* Validation results */}
      {validationResults && (
        <div className="mt-6">
          {validationResults.errors.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">The uploaded CSV is empty.</div>
          ) : (
            <>
              <div className="mb-3 text-base font-medium flex gap-6">
                <span className="text-green-700 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Valid rows: {validationResults.valid}</span>
                <span className="text-red-700 flex items-center gap-1"><XCircle className="h-4 w-4" /> Invalid rows: {validationResults.invalid}</span>
              </div>
              <div className="overflow-x-auto rounded border border-border/40 bg-muted/50">
                <Table className="min-w-full text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="px-3 py-2 text-left font-semibold">Row</TableHead>
                      <TableHead className="px-3 py-2 text-left font-semibold">Status</TableHead>
                      <TableHead className="px-3 py-2 text-left font-semibold">Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.errors.map((errs, i) => (
                      <TableRow key={i} className={errs.length ? 'bg-red-50' : 'bg-green-50'}>
                        <TableCell className="px-3 py-2">{i + 2}</TableCell>
                        <TableCell className="px-3 py-2 flex items-center gap-1">
                          {errs.length ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {errs.length ? 'Invalid' : 'Valid'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-red-600">
                          {errs.length ? errs.join('; ') : <span className="text-green-700">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
} 