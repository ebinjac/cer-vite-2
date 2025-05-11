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
import { ScrollArea } from '@/components/ui/scroll-area'

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

type UploadStatus = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

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
  const [validationResults, setValidationResults] = React.useState<null | { valid: number, invalid: number, errors: string[][] }>(null)
  const [processing, setProcessing] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [showSummary, setShowSummary] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus[]>([])
  const [rowsData, setRowsData] = React.useState<any[]>([])
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
  })

  const file = files[0]

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  const parseCsv = (content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean)
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
    return { headers, rows }
  }

  const validateRow = (row: string[], headers: string[], isAmex: boolean) => {
    const errors: string[] = []
    const requiredFields = isAmex ? AMEX_FIELDS : NON_AMEX_FIELDS

    // Check for missing required fields
    requiredFields.forEach((field, index) => {
      if (!row[index] || row[index].trim() === '') {
        errors.push(`Missing ${field}`)
      }
    })

    // Validate environment if present
    const envIndex = headers.indexOf('environment')
    if (envIndex !== -1 && row[envIndex] && !ENV_OPTIONS.includes(row[envIndex])) {
      errors.push(`Invalid environment: ${row[envIndex]}. Must be one of: ${ENV_OPTIONS.join(', ')}`)
    }

    return errors
  }

  const validateCsv = async (fileContent: string) => {
    try {
      const { headers, rows } = parseCsv(fileContent)
      const isAmex = headers.length === AMEX_FIELDS.length && AMEX_FIELDS.every((f, i) => headers[i] === f)
      const errors = rows.map(row => validateRow(row, headers, isAmex))
      const valid = errors.filter(e => e.length === 0).length
      const invalid = errors.filter(e => e.length > 0).length

      setValidationResults({ valid, invalid, errors })
      setRowsData(rows.map((row, i) => {
        const rowData: Record<string, string> = {}
        headers.forEach((h, idx) => { rowData[h] = row[idx] || '' })
        return rowData
      }))

      return { valid, invalid, errors }
    } catch (err) {
      console.error('Failed to validate CSV:', err)
      toast.error('Failed to validate CSV file')
      return null
    }
  }

  const buildPayload = (rowData: Record<string, string>, isAmex: boolean) => {
    const payload = {
      ...rowData,
      teamName: selectedTeam,
      isAmexCert: isAmex ? 'Yes' : 'No'
    }
    return payload
  }

  const uploadCertificate = async (payload: any) => {
    const response = await fetch(CERTIFICATE_SAVE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to upload certificate')
    }

    return response.json()
  }

  React.useEffect(() => {
    if (file?.file instanceof File) {
      setProcessing(true)
      readFileAsText(file.file)
        .then(validateCsv)
        .catch(err => {
          console.error('Failed to process file:', err)
          toast.error('Failed to process file')
        })
        .finally(() => setProcessing(false))
    }
  }, [file])

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
        
        // Only call onUploadSuccess if all uploads were successful
        const allSuccess = statusArr.every(s => s.status === 'success')
        if (allSuccess && onUploadSuccess) {
          onUploadSuccess()
        }
      })
      .catch(err => {
        console.error('Failed to process file:', err)
        toast.error('Failed to process file')
      })
  }, [validationResults, file, readFileAsText, processUpload, onUploadSuccess, queryClient])

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = React.useState(1)
  const totalPages = Math.ceil((validationResults?.errors.length || 0) / itemsPerPage)

  const uploadProgress = React.useMemo(() => {
    if (!uploading) return 0
    const completed = uploadStatus.filter(s => s.status === 'success' || s.status === 'error').length
    return Math.round((completed / uploadStatus.length) * 100)
  }, [uploadStatus, uploading])

  return (
    <div className="w-full my-8">
      <AnimatePresence mode="wait">
        {!uploading && (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Upload Certificates</h2>
                <p className="text-muted-foreground">Upload a CSV file containing certificate details.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsvTemplate(AMEX_FIELDS, 'amex-template.csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Amex Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsvTemplate(NON_AMEX_FIELDS, 'non-amex-template.csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Non-Amex Template
                </Button>
              </div>
            </div>

            <div
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

            {file && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    <PaperclipIcon className="size-4 opacity-60" />
                    <span className="text-sm font-medium">{file.file.name}</span>
                    <span className="text-muted-foreground text-xs">({formatBytes(file.file.size)})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0"
                    onClick={() => removeFile(file.id)}
                  >
                    <XIcon className="size-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              </div>
            )}

            {processing && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Processing file...</span>
              </div>
            )}

            {validationResults && (
              <div className="space-y-4">
                {validationResults.errors.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">The uploaded CSV is empty.</div>
                ) : (
                  <>
                    <div className="mb-3 text-base font-medium flex gap-6">
                      <span className="text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Valid rows: {validationResults.valid}
                      </span>
                      <span className="text-red-700 flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Invalid rows: {validationResults.invalid}
                      </span>
                    </div>

                    {validationResults.invalid === 0 && validationResults.valid > 0 && (
                      <div className="mb-4">
                        <Button onClick={handleBulkUpload} disabled={uploading} className="w-48">
                          {uploading ? 'Uploading...' : 'Start Bulk Upload'}
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <ScrollArea className="h-[400px] rounded border border-border/40 bg-muted/50">
                        <Table>
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
                      </ScrollArea>

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
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {uploading && (
          <motion.div
            key="upload-status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex flex-col items-center mb-6">
              <h2 className="text-2xl font-semibold mb-4">
                {showSummary ? 'Upload Complete' : 'Uploading Certificates'}
              </h2>
              <div className="w-full mb-2">
                <Progress value={uploadProgress} className="h-2" />
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">{uploadProgress}% Complete</p>
                {showSummary && (
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">
                      {uploadStatus.filter(s => s.status === 'success').length} Successful
                    </span>
                    {' • '}
                    <span className="text-red-600 font-medium">
                      {uploadStatus.filter(s => s.status === 'error').length} Failed
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="h-[500px] rounded-lg border border-border/40">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left font-semibold w-1/3">Certificate</TableHead>
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
                          <div className="flex flex-col">
                            <span className={
                              stat.status === 'error' ? 'text-red-600' :
                              stat.status === 'success' ? 'text-green-600' :
                              'text-blue-600'
                            }>
                              {stat.status === 'loading' ? 'Uploading...' :
                               stat.status === 'success' ? 'Uploaded Successfully' :
                               stat.status === 'error' ? 'Upload Failed' :
                               'Waiting...'}
                            </span>
                            {stat.status === 'error' && stat.message && (
                              <span className="text-xs text-red-600 mt-0.5 break-words max-w-md">
                                Error: {stat.message}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {showSummary && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploading(false)
                    setShowSummary(false)
                    setValidationResults(null)
                    setUploadStatus([])
                    setRowsData([])
                    if (file) {
                      removeFile(file.id)
                    }
                  }}
                >
                  Upload More Certificates
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 