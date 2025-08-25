// hooks/useBulkUpload.ts
import * as React from 'react'
import { parseCsv as defaultParseCsv, toRowMap, type ParsedCsv } from '@/lib/csv'

export type UploadRowStatus = 'idle' | 'loading' | 'success' | 'error'
export type UploadStatus = { status: UploadRowStatus; message?: string }

export type ValidationResults = {
  valid: number
  invalid: number
  errors: string[][]
  headers: string[]
  rows: string[][]
}

type GuardOk<C> = { ok: true; ctx: C }
type GuardErr = { ok: false; error: string }

export type UseBulkUploadConfig<C> = {
  // CSV parsing. Default supports comma/tab inference. Certificates can force comma.
  parseCsv?: (text: string) => ParsedCsv
  // Optional header guard. If it fails, all rows become invalid with given error.
  headersGuard?: (headers: string[]) => GuardOk<C> | GuardErr
  // Compute context from headers if no guard.
  getContext?: (headers: string[]) => C
  // Row validation (per-row)
  validateRow: (row: Record<string, string>, ctx: C) => string[]
  // Build payload for API
  buildPayload: (row: Record<string, string>, ctx: C) => any
  // API uploader
  uploadRow: (payload: any) => Promise<void>
  // Row preview for UI lists
  getPreview?: (row: string[], headers: string[], ctx: C) => { primary: string; secondary?: string }
}

export function useBulkUpload<C>(config: UseBulkUploadConfig<C>) {
  const {
    parseCsv = defaultParseCsv,
    headersGuard,
    getContext,
    validateRow,
    buildPayload,
    uploadRow,
    getPreview,
  } = config

  const [validation, setValidation] = React.useState<ValidationResults | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [showSummary, setShowSummary] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus[]>([])
  const [previews, setPreviews] = React.useState<{ primary: string; secondary?: string }[]>([])

  const [hasCompletedProcessing, setHasCompletedProcessing] = React.useState(false)

  const reset = React.useCallback(() => {
    setValidation(null)
    setUploading(false)
    setProcessing(false)
    setShowSummary(false)
    setUploadStatus([])
    setPreviews([])
    setHasCompletedProcessing(false)
  }, [])

  const validateFile = React.useCallback(async (file: File) => {
    setProcessing(true)
    try {
      const text = await file.text()
      const { headers, rows } = parseCsv(text)

      // Determine context
      let ctx: C
      if (headersGuard) {
        const guard = headersGuard(headers)
        if (!guard.ok) {
          const errors = rows.map(() => [guard.error])
          const result: ValidationResults = {
            valid: 0, invalid: rows.length, errors, headers, rows
          }
          setValidation(result)
          setPreviews(rows.map(() => ({ primary: '', secondary: '' })))
          return result
        }
        ctx = guard.ctx
      } else {
        // No guard -> allow custom context creation or undefined
        ctx = (getContext ? getContext(headers) : undefined) as C
      }

      const errs: string[][] = []
      let valid = 0
      let invalid = 0
      const previewList: { primary: string; secondary?: string }[] = []

      for (const rowArr of rows) {
        const rowMap = toRowMap(headers, rowArr)
        const rowErrors = validateRow(rowMap, ctx)
        if (rowErrors.length) {
          errs.push(rowErrors)
          invalid++
        } else {
          errs.push([])
          valid++
        }
        if (getPreview) {
          previewList.push(getPreview(rowArr, headers, ctx))
        }
      }

      const result: ValidationResults = { valid, invalid, errors: errs, headers, rows }
      setValidation(result)
      setPreviews(previewList)
      return result
    } finally {
      setProcessing(false)
    }
  }, [parseCsv, headersGuard, getContext, validateRow, getPreview])

  const startUpload = React.useCallback(async () => {
    if (!validation) return
    setUploading(true)
    setShowSummary(false)
    setHasCompletedProcessing(false)

    const { rows, headers, errors } = validation
    // Upload only valid rows
    const validRows = rows.filter((_, i) => errors[i].length === 0)
    const statusArr: UploadStatus[] = validRows.map(() => ({ status: 'idle' }))
    setUploadStatus(statusArr)

    // Sequential processing to preserve behavior
    const processRow = async (row: string[], index: number) => {
      statusArr[index] = { status: 'loading' }
      setUploadStatus([...statusArr])

      const rowMap = toRowMap(headers, row as string[])
      const ctx: any = (headersGuard ? (headersGuard(headers) as any)?.ctx : getContext?.(headers)) as C

      try {
        const payload = buildPayload(rowMap, ctx)
        await uploadRow(payload)
        statusArr[index] = { status: 'success' }
      } catch (e: any) {
        statusArr[index] = { status: 'error', message: e?.message || 'Unknown error occurred' }
      }
      setUploadStatus([...statusArr])
    }

    try {
      for (let i = 0; i < validRows.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await processRow(validRows[i], i)
      }
      setHasCompletedProcessing(true)
      setShowSummary(true)
    } finally {
      setUploading(false)
    }
  }, [validation, headersGuard, getContext, buildPayload, uploadRow])

  const uploadProgress = React.useMemo(() => {
    if (!uploading) return 0
    const completed = uploadStatus.filter(s => s.status === 'success' || s.status === 'error').length
    return validation && validation.valid > 0
      ? Math.round((completed / validation.valid) * 100)
      : 0
  }, [uploading, uploadStatus, validation])

  return {
    // state
    validation,
    uploading,
    processing,
    showSummary,
    uploadStatus,
    previews,
    hasCompletedProcessing,
    uploadProgress,
    // actions
    reset,
    validateFile,
    startUpload,
  }
}
