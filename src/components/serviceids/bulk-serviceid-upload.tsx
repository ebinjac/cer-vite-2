"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, UploadCloud, CheckCircle2, XCircle, PaperclipIcon, AlertCircleIcon, XIcon, Loader2 } from 'lucide-react'
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload'
import type { FileWithPreview } from '@/hooks/use-file-upload'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'
import { SERVICEID_CREATE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper"

const SERVICEID_FIELDS = [
  'svcid',
  'env',
  'application',
  'expDate',
  'renewalProcess',
  'comment',
]

const ENV_OPTIONS = ['E1', 'E2', 'E3']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

type UploadStatus = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

const UPLOAD_STEPS = [
  {
    step: 1,
    title: "Select File",
    description: "Upload your CSV file",
  },
  {
    step: 2,
    title: "Validation",
    description: "Review validation results",
  },
  {
    step: 3,
    title: "Processing",
    description: "Upload service IDs",
  },
  {
    step: 4,
    title: "Complete",
    description: "View upload status",
  },
] as const

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

function parseCsv(text: string) {
  // Support both comma and tab as delimiter
  const delimiter = text.includes('\t') ? '\t' : ','
  const rows = text.split('\n').map(line => line.split(new RegExp(delimiter)).map(cell => cell.trim()))
  const headers = rows.shift() || []
  return { headers, rows: rows.filter(row => row.some(cell => cell)) }
}

function headersMatch(headers: string[], expected: string[]): boolean {
  if (headers.length !== expected.length) return false
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].replace(/\s+/g, '').toLowerCase() !== expected[i].replace(/\s+/g, '').toLowerCase()) {
      return false
    }
  }
  return true
}

export default function BulkServiceIdUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [validationResults, setValidationResults] = React.useState<null | { valid: number, invalid: number, errors: string[][] }>(null)
  const [processing, setProcessing] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [showSummary, setShowSummary] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus[]>([])
  const [currentStep, setCurrentStep] = React.useState(1)
  const [canNavigateToStep, setCanNavigateToStep] = React.useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
  })

  const { selectedTeam } = useTeamStore()
  const queryClient = useQueryClient()
  const [applications, setApplications] = React.useState<string[]>([])
  const [appLoading, setAppLoading] = React.useState(false)
  const [appError, setAppError] = React.useState<string | null>(null)
  const [hasCompletedProcessing, setHasCompletedProcessing] = React.useState(false)
  const [rowsData, setRowsData] = React.useState<Array<{ svcid: string; application: string }>>([])

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
    multiple: false,
    onFilesChange: async (files) => {
      setValidationResults(null)
      if (!files.length) return
      setProcessing(true)
      try {
        const file = files[0]?.file as File
        const text = await file.text()
        const { headers, rows } = parseCsv(text)
        // Validate headers
        const isValidTemplate = headersMatch(headers, SERVICEID_FIELDS)
        if (!isValidTemplate) {
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
          const rowErrors = validateRow(row)
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

  // Load applications when team changes
  React.useEffect(() => {
    if (!selectedTeam) return
    setAppLoading(true)
    setAppError(null)
    fetch(APPLICATION_LIST_API(selectedTeam))
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch applications')
        const text = await res.text()
        let apps: string[] = []
        try {
          apps = JSON.parse(text)
        } catch {
          apps = text
            .replace(/\[|\]/g, '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        }
        setApplications(apps)
        setAppLoading(false)
      })
      .catch(err => {
        setAppError(err.message || 'Failed to fetch applications')
        setAppLoading(false)
      })
  }, [selectedTeam])

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
          svcid: row[0] || '',
          application: row[2] || ''
        }))
        setRowsData(data)
      } catch (err) {
        console.error('Failed to load row data:', err)
      }
    }
    fileReader.readAsText(file.file as File)
  }, [file, validationResults])

  function validateRow(row: Record<string, string>): string[] {
    const errors: string[] = []
    
    // Required fields
    if (!row.svcid) errors.push('Service ID is required')
    if (!row.env) {
      errors.push('Environment is required')
    } else if (!ENV_OPTIONS.includes(row.env.toUpperCase())) {
      errors.push(`Environment must be one of: ${ENV_OPTIONS.join(', ')}`)
    }
    
    // Application validation
    if (!row.application) {
      errors.push('Application is required')
    } else if (applications.length > 0 && !applications.includes(row.application)) {
      errors.push(`Application must be one of: ${applications.join(', ')}`)
    }

    // Expiry date validation
    if (!row.expDate) {
      errors.push('Expiry date is required')
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(row.expDate)) {
        errors.push('Expiry date must be in YYYY-MM-DD format')
      }
    }

    // Renewal process validation
    if (!row.renewalProcess) {
      errors.push('Renewal process is required')
    } else if (!['Manual', 'Automated'].includes(row.renewalProcess)) {
      errors.push('Renewal process must be either Manual or Automated')
    }

    return errors
  }

  function buildPayload(row: Record<string, string>): any {
    return {
      svcid: row.svcid,
      env: row.env.toUpperCase(),
      application: row.application,
      expDate: row.expDate,
      renewalProcess: row.renewalProcess,
      comment: row.comment || '',
      renewingTeamName: selectedTeam,
    }
  }

  const uploadServiceId = React.useCallback(async (payload: any): Promise<void> => {
    const response = await fetch(SERVICEID_CREATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText)
    }
  }, [])

  const processRow = React.useCallback((
    row: string[],
    headers: string[],
    index: number,
    statusArr: UploadStatus[]
  ): Promise<void> => {
    statusArr[index] = { status: 'loading' }
    setUploadStatus([...statusArr])

    const rowData: Record<string, string> = {}
    headers.forEach((h, idx) => { rowData[h] = row[idx] || '' })
    const payload = buildPayload(rowData)

    return uploadServiceId(payload)
      .then(() => {
        statusArr[index] = { status: 'success' }
        setUploadStatus([...statusArr])
      })
      .catch(err => {
        statusArr[index] = { 
          status: 'error', 
          message: err.message || 'Unknown error occurred'
        }
        setUploadStatus([...statusArr])
      })
  }, [uploadServiceId])

  const processUpload = React.useCallback((fileContent: string, validationResults: any) => {
    const { headers, rows } = parseCsv(fileContent)
    const validRows = rows.filter((_, i) => validationResults.errors[i].length === 0)
    const statusArr: UploadStatus[] = validRows.map(() => ({ status: 'idle' }))
    setUploadStatus(statusArr)

    return validRows.reduce((promise, row, index) => {
      return promise.then(() => processRow(row, headers, index, statusArr))
    }, Promise.resolve())
      .then(() => statusArr)
  }, [processRow])

  const handleStepChange = React.useCallback((step: number) => {
    if (canNavigateToStep[step]) {
      setCurrentStep(step)
    }
  }, [canNavigateToStep])

  React.useEffect(() => {
    setCanNavigateToStep(prev => ({
      1: true,
      2: Boolean(validationResults),
      3: Boolean(validationResults?.valid && validationResults.invalid === 0),
      4: Boolean(showSummary),
    }))
  }, [validationResults, showSummary])

  React.useEffect(() => {
    if (uploading) {
      setCurrentStep(3)
    } else if (showSummary && hasCompletedProcessing) {
      setCurrentStep(4)
    } else if (validationResults) {
      setCurrentStep(2)
    } else {
      setCurrentStep(1)
    }
  }, [uploading, showSummary, validationResults, hasCompletedProcessing])

  const handleBulkUpload = React.useCallback(() => {
    if (!validationResults || !file?.file || !(file.file instanceof File)) return
    setUploading(true)
    setShowSummary(false)
    setHasCompletedProcessing(false)

    const fileReader = new FileReader()
    fileReader.onload = (e) => {
      const fileContent = e.target?.result as string
      if (!fileContent) {
        toast.error('Failed to read file content')
        setUploading(false)
        return
      }

      processUpload(fileContent, validationResults)
        .then(statusArr => {
          setHasCompletedProcessing(true)
          const hasErrors = statusArr.some(s => s.status === 'error')
          setShowSummary(true)
          if (!hasErrors) {
            queryClient.invalidateQueries({ queryKey: ['serviceids'] })
            if (onUploadSuccess) {
              onUploadSuccess()
            }
          }
        })
        .catch(err => {
          console.error('Failed to process file:', err)
          toast.error('Failed to process file')
        })
        .finally(() => {
          setUploading(false)
        })
    }
    fileReader.readAsText(file.file)
  }, [validationResults, file, processUpload, onUploadSuccess, queryClient])

  const uploadProgress = React.useMemo(() => {
    if (!uploading) return 0
    const completed = uploadStatus.filter(s => s.status === 'success' || s.status === 'error').length
    return Math.round((completed / uploadStatus.length) * 100)
  }, [uploadStatus, uploading])

  return (
    <div className="w-full my-8 px-4">
      <div className="max-w-3xl mx-auto mb-8">
        <div className="space-y-8">
          <Stepper value={currentStep} onChange={handleStepChange}>
            {UPLOAD_STEPS.map(({ step, title, description }) => (
              <StepperItem
                key={step}
                step={step}
                className="relative flex-1 flex-col!"
              >
                <StepperTrigger 
                  className="flex-col gap-3 rounded"
                  disabled={!canNavigateToStep[step]}
                >
                  <StepperIndicator />
                  <div className="space-y-0.5 px-2">
                    <StepperTitle>{title}</StepperTitle>
                    <StepperDescription className="max-sm:hidden">
                      {description}
                    </StepperDescription>
                  </div>
                </StepperTrigger>
                {step < UPLOAD_STEPS.length && (
                  <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                )}
              </StepperItem>
            ))}
          </Stepper>
          <h2 className="text-2xl font-semibold mb-2">Bulk Upload Service IDs</h2>
          <div className="text-sm text-muted-foreground mb-4">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Download the CSV template for Service IDs.</li>
              <li>Fill in all required fields. <span className="font-medium">Do not change the header row.</span></li>
              <li>Environment must be E1, E2, or E3. Expiry date must be YYYY-MM-DD.</li>
            </ol>
          </div>
          <Button variant="outline" onClick={() => downloadCsvTemplate(SERVICEID_FIELDS, 'serviceid-template.csv')} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Service ID CSV Template
          </Button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {/* Step 1: File Selection */}
        {!validationResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto"
          >
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
              <input {...getInputProps({ accept: '.csv', multiple: false })} className="sr-only" aria-label="Upload file" disabled={Boolean(file)} />
              <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border" aria-hidden="true">
                  <UploadCloud className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">Upload CSV file</p>
                <p className="text-muted-foreground text-xs">Drag & drop or click to browse (max. {formatBytes(MAX_SIZE)})</p>
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
                <div className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <PaperclipIcon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{file.file.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => removeFile(file.id)}
                  >
                    <XIcon className="size-3" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* Step 2: Validation Results */}
        {validationResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Valid: {validationResults.valid}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Invalid: {validationResults.invalid}</span>
              </div>
            </div>
            {validationResults.invalid > 0 && (
              <div className="bg-destructive/10 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-destructive mb-1">Validation Errors Found</h3>
                <p className="text-sm text-destructive/90">
                  Please fix the following errors and re-upload the file:
                </p>
              </div>
            )}
            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead className="w-20 px-3 py-2 text-left font-semibold">Row</TableHead>
                      <TableHead className="w-24 px-3 py-2 text-left font-semibold">Status</TableHead>
                      <TableHead className="px-3 py-2 text-left font-semibold">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.errors.map((errs, i) => (
                      <TableRow 
                        key={i} 
                        className={cn(
                          errs.length > 0 ? "bg-destructive/5" : "bg-green-50"
                        )}
                      >
                        <TableCell className="px-3 py-2">{i + 2}</TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            {errs.length > 0 ? (
                              <>
                                <XCircle className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Invalid</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-green-700">Valid</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "px-3 py-2",
                          errs.length > 0 ? "text-destructive" : "text-green-700"
                        )}>
                          {errs.length > 0 ? errs.join('; ') : 'All fields valid'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            {validationResults.invalid === 0 && validationResults.valid > 0 && (
              <div className="mt-4">
                <Button onClick={handleBulkUpload} disabled={uploading || processing} className="w-48">
                  {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Start Bulk Upload'}
                </Button>
              </div>
            )}
            {/* Upload Progress */}
            {uploading && (
              <div className="mt-8">
                <div className="flex flex-col items-center mb-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Uploading Service IDs
                  </h2>
                  <div className="w-full mb-2">
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">{uploadProgress}% Complete</p>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/40">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted z-10">
                        <TableRow>
                          <TableHead className="px-4 py-3 text-left font-semibold">Service ID</TableHead>
                          <TableHead className="w-48 px-4 py-3 text-left font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rowsData.map((row, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b last:border-0"
                          >
                            <TableCell className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{row.svcid}</span>
                                <span className="text-sm text-muted-foreground">{row.application}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {uploadStatus[index]?.status === 'loading' && (
                                  <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                  </motion.div>
                                )}
                                {uploadStatus[index]?.status === 'success' && (
                                  <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  </motion.div>
                                )}
                                {uploadStatus[index]?.status === 'error' && (
                                  <motion.div
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </motion.div>
                                )}
                                <div className="flex flex-col">
                                  <span className={cn(
                                    uploadStatus[index]?.status === 'error' && 'text-destructive',
                                    uploadStatus[index]?.status === 'success' && 'text-green-600',
                                    uploadStatus[index]?.status === 'loading' && 'text-blue-600'
                                  )}>
                                    {uploadStatus[index]?.status === 'loading' ? 'Uploading...' :
                                     uploadStatus[index]?.status === 'success' ? 'Uploaded' :
                                     uploadStatus[index]?.status === 'error' ? 'Failed' : 'Pending'}
                                  </span>
                                  {uploadStatus[index]?.status === 'error' && uploadStatus[index]?.message && (
                                    <span className="text-xs text-destructive mt-0.5 whitespace-normal break-words">
                                      {uploadStatus[index].message}
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
                </div>
              </div>
            )}
            {/* Summary */}
            {showSummary && !uploading && (
              <div className="rounded-lg bg-card border p-8 mt-8">
                <div className="flex items-center gap-4 mb-6">
                  {uploadStatus.some(s => s.status === 'error') ? (
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
                      {uploadStatus.some(s => s.status === 'error')
                        ? 'Some Service IDs failed to upload'
                        : 'All Service IDs were uploaded successfully'}
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
                      {uploadStatus.filter(s => s.status === 'success').length}
                      <span className="text-base text-green-600 font-normal"> of {uploadStatus.length}</span>
                    </p>
                  </div>
                  {uploadStatus.some(s => s.status === 'error') && (
                    <div className="rounded-lg bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <h3 className="font-medium">Failed Uploads</h3>
                      </div>
                      <p className="text-2xl font-semibold text-destructive">
                        {uploadStatus.filter(s => s.status === 'error').length}
                        <span className="text-base text-destructive/80 font-normal"> of {uploadStatus.length}</span>
                      </p>
                    </div>
                  )}
                </div>
                {uploadStatus.some(s => s.status === 'error') && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Error Details</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {uploadStatus.map((status, index) => (
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
                  <Button onClick={() => {
                    setValidationResults(null)
                    setUploading(false)
                    setShowSummary(false)
                    setUploadStatus([])
                    setRowsData([])
                    if (file) removeFile(file.id)
                  }}>
                    Upload Another File
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 