// components/bulk-upload/BulkUploadWizard.tsx
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from '@/components/ui/stepper'
import { UploadDropzone } from './upload-dropzone'
import { ValidationTable } from './validation-table'
import { ProcessingTable } from './processing-table'
import { SummaryPanel } from './summary-panel'
import type { ValidationResults } from '@/hooks/use-bulk-upload'

type StepInfo = { step: number; title: string; description: string }

const DEFAULT_STEPS: StepInfo[] = [
    { step: 1, title: 'Select File', description: 'Upload your CSV file' },
    { step: 2, title: 'Validation', description: 'Review validation results' },
    { step: 3, title: 'Processing', description: 'Upload items' },
    { step: 4, title: 'Complete', description: 'View upload status' },
]

type RowPreview = { primary: string; secondary?: string }

type Props = {
    // State and actions from useBulkUpload
    validation: ValidationResults | null
    uploading: boolean
    processing: boolean
    showSummary: boolean
    hasCompletedProcessing: boolean
    uploadStatus: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }[]
    uploadProgress: number
    previews: RowPreview[]

    // Actions
    onValidate: (file: File) => Promise<ValidationResults | void>
    onStartUpload: (file: File) => Promise<void>
    onReset: () => void

    // Dropzone
    maxSize: number
    accept?: string

    // UI customization
    steps?: StepInfo[]
    header: React.ReactNode
    preDropzone?: React.ReactNode
    afterValidationCTA?: React.ReactNode
    processingTitle?: string

    // External behaviors
    file: File | null
    setFile: (file: File | null) => void

    // For certificate flow, let parent invalidate queries or show toast after summary
    onAllSuccess?: () => void
}

export function BulkUploadWizard({
    validation,
    uploading,
    processing,
    showSummary,
    hasCompletedProcessing,
    uploadStatus,
    uploadProgress,
    previews,
    onValidate,
    onStartUpload,
    onReset,
    maxSize,
    accept = '.csv',
    steps = DEFAULT_STEPS,
    header,
    preDropzone,
    afterValidationCTA,
    processingTitle = 'Uploading Items',
    file,
    setFile,
    onAllSuccess,
}: Props) {
    const [currentStep, setCurrentStep] = React.useState(1)
    const [canNavigateToStep, setCanNavigateToStep] = React.useState<Record<number, boolean>>({
        1: true,
        2: false,
        3: false,
        4: false,
    })

    React.useEffect(() => {
        setCanNavigateToStep({
            1: true,
            2: Boolean(validation),
            3: Boolean(validation?.valid && validation.invalid === 0),
            4: Boolean(showSummary),
        })
    }, [validation, showSummary])

    React.useEffect(() => {
        if (uploading) {
            setCurrentStep(3)
        } else if (showSummary && hasCompletedProcessing) {
            setCurrentStep(4)
            if (uploadStatus.length > 0 && uploadStatus.every(s => s.status === 'success')) {
                onAllSuccess?.()
            }
        } else if (validation) {
            setCurrentStep(2)
        } else {
            setCurrentStep(1)
        }
    }, [uploading, showSummary, validation, hasCompletedProcessing, uploadStatus, onAllSuccess])

    const handleStepChange = React.useCallback((step: number) => {
        if (canNavigateToStep[step]) setCurrentStep(step)
    }, [canNavigateToStep])

    return (
        <div className="w-full my-8 px-4">
            <div className="max-w-4xl mx-auto mb-8">
                <div className="space-y-8">
                    <Stepper className=' gap-0' value={currentStep} onChange={handleStepChange}>
                        {steps.map(({ step, title, description }) => (
                            <StepperItem key={step} step={step} className="relative flex-1">
                                <StepperTrigger className="flex-col gap-3 rounded" disabled={!canNavigateToStep[step]}>
                                    <StepperIndicator />
                                    <div className="space-y-0.5 px-2">
                                        <StepperTitle>{title}</StepperTitle>
                                        <StepperDescription className="max-sm:hidden">{description}</StepperDescription>
                                    </div>
                                </StepperTrigger>
                                {step < steps.length && (
                                    <StepperSeparator
                                        className="absolute -order-1 m-0 top-3 -translate-y-1/2   left-[calc(50%+0.875rem)] w-[calc(100%-1.75rem)] right-auto    group-data-[orientation=horizontal]/stepper:flex-none
  "
                                    />)}
                            </StepperItem>
                        ))}
                    </Stepper>
                    {header}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="max-w-4xl mx-auto">
                        {preDropzone}
                        <UploadDropzone
                            maxSize={maxSize}
                            accept={accept}
                            onFileReady={async (f) => {
                                setFile(f)
                                await onValidate(f)
                            }}
                            onClear={() => {
                                setFile(null)
                                onReset()
                            }}
                        />
                    </motion.div>
                )}

                {currentStep === 2 && validation && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-6 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-green-700">Valid: {validation.valid}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-destructive">Invalid: {validation.invalid}</span>
                            </div>
                        </div>

                        {validation.invalid > 0 && (
                            <div className="bg-destructive/10 rounded-lg p-4 mb-4">
                                <h3 className="font-medium text-destructive mb-1">Validation Errors Found</h3>
                                <p className="text-sm text-destructive/90">Please fix the following errors and re-upload the file:</p>
                            </div>
                        )}

                        <ValidationTable errors={validation.errors} />

                        {validation.invalid === 0 && validation.valid > 0 && (
                            <div className="mt-4">
                                <Button onClick={() => file && onStartUpload(file)} disabled={uploading || processing} className="w-48">
                                    {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Start Bulk Upload'}
                                </Button>
                            </div>
                        )}

                        {afterValidationCTA}
                    </motion.div>
                )}

                {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
                        <div className="flex flex-col items-center mb-6">
                            <h2 className="text-2xl font-semibold mb-4">{uploading ? processingTitle : 'Upload Progress'}</h2>
                            <div className="w-full mb-2">
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                            <p className="text-sm text-muted-foreground">{uploadProgress}% Complete</p>
                        </div>

                        <ProcessingTable rows={previews} statuses={uploadStatus} />
                    </motion.div>
                )}

                {currentStep === 4 && showSummary && !uploading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
                        <SummaryPanel
                            statuses={uploadStatus}
                            onUploadAnother={() => {
                                onReset()
                                setFile(null)
                                setCurrentStep(1)
                            }}
                            onViewDetails={() => setCurrentStep(3)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
