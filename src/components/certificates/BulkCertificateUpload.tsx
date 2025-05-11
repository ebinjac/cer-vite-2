import * as React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, UploadCloud, CheckCircle2, XCircle, PaperclipIcon, AlertCircleIcon, XIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload'
import type { FileWithPreview } from '@/hooks/use-file-upload'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'
import { CERTIFICATE_SAVE_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import { useQueryClient } from '@tanstack/react-query'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

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
  const [uploading, setUploading] = React.useState(false)
  const [showSummary, setShowSummary] = React.useState(false)
  const queryClient = useQueryClient()
  const { selectedTeam } = useTeamStore()
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
  const [rowsData, setRowsData] = React.useState<Array<{ commonName: string; applicationName: string }>>([])

  // Load row data when file changes
  React.useEffect(() => {
    if (!file?.file || !validationResults) return
    
    const fileReader = new FileReader()
    fileReader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text) return
        
        const { rows } = parseCsv(text)
        const data = rows.map(row => ({
          commonName: row[0] || '',
          applicationName: row[3] || ''
        }))
        setRowsData(data)
      } catch (err) {
        console.error('Failed to load row data:', err)
      }
    }
    fileReader.readAsText(file.file as File)
  }, [file, validationResults])

  // Helper to build payload for API
  function buildPayload(row: Record<string, string>, isAmex: boolean): any {
    const allFields = [
      'commonName',
      'serialNumber',
      'centralID',
      'applicationName',
      'isAmexCert',
      'validTo',
      'environment',
      'comment',
      'serverName',
      'keystorePath',
      'uri',
    ]
    const payload: any = {}
    for (const key of allFields) {
      if (key === 'validTo') {
        payload.validTo = !isAmex && row.validTo ? row.validTo : ''
      } else if (key === 'isAmexCert') {
        payload.isAmexCert = isAmex ? 'Yes' : 'No'
      } else {
        payload[key] = row[key] ?? ''
      }
    }
    payload.renewingTeamName = selectedTeam || ''
    // For bulk, always send all fields (no showMore logic)
    return payload
  }

  const readFileAsText = React.useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string || '')
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  const uploadCertificate = React.useCallback((payload: any): Promise<void> => {
    return fetch(CERTIFICATE_SAVE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(res => {
      if (!res.ok) {
        return res.text().then(errorText => {
          throw new Error(errorText || `Failed: ${res.status} ${res.statusText}`)
        })
      }
    })
  }, [])

  type UploadStatus = {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }

  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus[]>([])

  const processRow = React.useCallback((
    row: string[],
    headers: string[],
    isAmex: boolean,
    index: number,
    statusArr: UploadStatus[]
  ): Promise<void> => {
    statusArr[index] = { status: 'loading' }
    setUploadStatus([...statusArr])

    const rowData: Record<string, string> = {}
    headers.forEach((h, idx) => { rowData[h] = row[idx] || '' })
    const payload = buildPayload(rowData, isAmex)

    return uploadCertificate(payload)
      .then(() => {
        statusArr[index] = { status: 'success' }
        setUploadStatus([...statusArr])
      })
      .catch(err => {
        statusArr[index] = { status: 'error', message: err?.message || 'Unknown error' }
        setUploadStatus([...statusArr])
      })
  }, [uploadCertificate])

  const processUpload = React.useCallback((fileContent: string, validationResults: any) => {
    const { headers, rows } = parseCsv(fileContent)
    const isAmex = headers.length === AMEX_FIELDS.length && AMEX_FIELDS.every((f, i) => headers[i] === f)
    
    // Only process valid rows
    const validRows = rows.filter((_, i) => validationResults.errors[i].length === 0)
    const statusArr: UploadStatus[] = validRows.map(() => ({ status: 'idle' }))
    setUploadStatus(statusArr)

    return validRows.reduce((promise, row, index) => {
      return promise.then(() => processRow(row, headers, isAmex, index, statusArr))
    }, Promise.resolve())
      .then(() => statusArr)
  }, [processRow])

  const handleBulkUpload = React.useCallback(() => {
    if (!validationResults || !file?.file || !(file.file instanceof File)) return
    setUploading(true)
    setShowSummary(false)

    readFileAsText(file.file)
      .then(fileContent => processUpload(fileContent, validationResults))
      .then(statusArr => {
        setShowSummary(true)
        queryClient.invalidateQueries({ queryKey: ['certificates'] })
        
        if (onUploadSuccess && statusArr.every(s => s.status === 'success')) {
          onUploadSuccess()
        }
      })
      .catch(err => {
        console.error('Failed to process file:', err)
        toast.error('Failed to process file')
      })
      .finally(() => {
        setUploading(false)
      })
  }, [validationResults, file, readFileAsText, processUpload, onUploadSuccess, queryClient])

  const itemsPerPage = 10 // Number of rows per page
  const [currentPage, setCurrentPage] = React.useState(1)
  const totalPages = Math.ceil((validationResults?.errors.length || 0) / itemsPerPage)

  // Add progress calculation
  const uploadProgress = React.useMemo(() => {
    if (!uploading) return 0
    const completed = uploadStatus.filter(s => s.status === 'success' || s.status === 'error').length
    return Math.round((completed / uploadStatus.length) * 100)
  }, [uploadStatus, uploading])

  return (
    <div className="w-full my-8 px-4">
      <AnimatePresence>
        {!uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
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
                    
                    {/* Bulk upload button moved above table */}
                    {validationResults.invalid === 0 && validationResults.valid > 0 && (
                      <div className="mb-4">
                        <Button onClick={handleBulkUpload} disabled={uploading} className="w-48">
                          {uploading ? 'Uploading...' : 'Start Bulk Upload'}
                        </Button>
                      </div>
                    )}

                    {/* Table with pagination */}
                    <div className="flex flex-col gap-2">
                      <div className="overflow-x-auto rounded border border-border/40 bg-muted/50">
                        <div className="max-h-[400px] overflow-y-auto">
                          <Table className="min-w-full text-xs">
                            <TableHeader className="sticky top-0 bg-muted z-10">
                              <TableRow>
                                <TableHead className="px-3 py-2 text-left font-semibold">Row</TableHead>
                                <TableHead className="px-3 py-2 text-left font-semibold">Status</TableHead>
                                <TableHead className="px-3 py-2 text-left font-semibold">Errors</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validationResults.errors
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((errs, i) => {
                                  const actualIndex = i + (currentPage - 1) * itemsPerPage
                                  return (
                                    <TableRow key={actualIndex} className={errs.length ? 'bg-red-50' : 'bg-green-50'}>
                                      <TableCell className="px-3 py-2">{actualIndex + 2}</TableCell>
                                      <TableCell className="px-3 py-2 flex items-center gap-1">
                                        {errs.length ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {errs.length ? 'Invalid' : 'Valid'}
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-red-600">
                                        {errs.length ? errs.join('; ') : <span className="text-green-700">—</span>}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Pagination */}
                      {validationResults.errors.length > itemsPerPage && (
                        <div className="flex justify-center mt-2">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  className="gap-1"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                              </PaginationItem>
                              {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i + 1}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(i + 1)}
                                    isActive={currentPage === i + 1}
                                  >
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                  disabled={currentPage === totalPages}
                                  className="gap-1"
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </div>

                    {/* Upload status table */}
                    {uploading && (
                      <div className="w-full max-w-2xl mt-4">
                        <div className="overflow-x-auto rounded border border-border/40">
                          <div className="max-h-[300px] overflow-y-auto">
                            <Table className="min-w-full text-xs">
                              <TableHeader className="sticky top-0 bg-muted z-10">
                                <TableRow>
                                  <TableHead className="px-3 py-2 text-left font-semibold">Row</TableHead>
                                  <TableHead className="px-3 py-2 text-left font-semibold">Status</TableHead>
                                  <TableHead className="px-3 py-2 text-left font-semibold">API Message</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {uploadStatus.map((stat, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="px-3 py-2">{i + 2}</TableCell>
                                    <TableCell className="px-3 py-2 flex items-center gap-1">
                                      {stat.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                      {stat.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                      {stat.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                                      {stat.status.charAt(0).toUpperCase() + stat.status.slice(1)}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 text-xs">
                                      {stat.status === 'error' ? (
                                        <span className="text-red-600">{stat.message}</span>
                                      ) : stat.status === 'success' ? (
                                        <span className="text-green-700">—</span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary section */}
                    {showSummary && (
                      <div className="w-full max-w-2xl mt-4">
                        <div className="rounded bg-muted p-4 text-sm flex flex-col gap-2">
                          <span className="font-medium">Bulk upload complete.</span>
                          <span>Success: {uploadStatus.filter(s => s.status === 'success').length} / {uploadStatus.length}</span>
                          <span>Failed: {uploadStatus.filter(s => s.status === 'error').length}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex flex-col items-center mb-6">
              <h2 className="text-2xl font-semibold mb-4">Uploading Certificates</h2>
              <div className="w-full mb-2">
                <Progress value={uploadProgress} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground">{uploadProgress}% Complete</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/40">
              <div className="max-h-[500px] overflow-y-auto">
                <Table className="min-w-full text-sm">
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-left font-semibold">Certificate</TableHead>
                      <TableHead className="px-4 py-3 text-left font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadStatus.map((stat, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="border-b last:border-0"
                      >
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{rowsData[i]?.commonName || `Row ${i + 2}`}</span>
                            {rowsData[i]?.applicationName && (
                              <span className="text-xs text-muted-foreground">{rowsData[i].applicationName}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {stat.status === 'loading' && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="h-4 w-4 text-blue-500" />
                              </motion.div>
                            )}
                            {stat.status === 'success' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </motion.div>
                            )}
                            {stat.status === 'error' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </motion.div>
                            )}
                            <span className={
                              stat.status === 'error' ? 'text-red-600' :
                              stat.status === 'success' ? 'text-green-600' :
                              'text-blue-600'
                            }>
                              {stat.status === 'loading' ? 'Uploading...' :
                               stat.status === 'success' ? 'Uploaded' :
                               stat.status === 'error' ? stat.message || 'Failed' :
                               'Waiting...'}
                            </span>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {showSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-lg bg-muted p-4"
              >
                <h3 className="font-medium mb-2">Upload Complete</h3>
                <div className="space-y-1 text-sm">
                  <p>Success: {uploadStatus.filter(s => s.status === 'success').length} / {uploadStatus.length}</p>
                  <p>Failed: {uploadStatus.filter(s => s.status === 'error').length}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 