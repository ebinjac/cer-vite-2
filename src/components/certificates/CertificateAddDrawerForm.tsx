import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DrawerClose } from '@/components/ui/drawer'
import { toast } from 'sonner'
import DatePicker from '../ui/DatePicker'
import { CERTIFICATE_SAVE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle, Check, ChevronDown, ChevronsUpDown, ClipboardList, HelpCircle, Info, Loader2, Plus, Server, ShieldCheck, Calendar, MessageSquare, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCertificateAddFormStore } from '@/store/certificate-add-form-store'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion, AnimatePresence } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const baseSchema = z.object({
  commonName: z.string().min(1, 'Common Name is required'),
  serialNumber: z.string().min(1, 'Serial Number is required'),
  centralID: z.string().min(1, 'Central ID is required'),
  applicationName: z.string().min(1, 'Application is required'),
  isAmexCert: z.enum(['Yes', 'No']),
  validTo: z.date().optional(),
  environment: z.string().optional(),
  comment: z.string().optional(),
  serverName: z.string().optional(),
  keystorePath: z.string().optional(),
  uri: z.string().optional(),
})

const schema = baseSchema.superRefine((values, ctx) => {
  if (values.isAmexCert === 'No') {
    if (!values.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validTo'],
        message: 'Expiry Date is required for Non Amex',
      })
    }
    if (!values.environment || !['E1', 'E2', 'E3'].includes(values.environment)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['environment'],
        message: 'Environment is required for Non Amex',
      })
    }
  }
})

export type CertificateAddFormValues = z.infer<typeof schema>

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
}

export function CertificateAddDrawerForm({ onSuccess, onCertificateAdded }: { onSuccess?: () => void, onCertificateAdded?: () => void }) {
  const [showMore, setShowMore] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)
  const { formValues, setFormValues, resetForm } = useCertificateAddFormStore()
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm<CertificateAddFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isAmexCert: 'Yes',
      ...formValues,
    },
  })

  const isAmexCert = watch('isAmexCert')
  const { selectedTeam } = useTeamStore()
  const [appOptions, setAppOptions] = React.useState<string[]>([])
  const [appLoading, setAppLoading] = React.useState(false)
  const [appError, setAppError] = React.useState<string | null>(null)
  const [appOpen, setAppOpen] = React.useState(false)

  // Persist form values on change
  React.useEffect(() => {
    const subscription = watch((values) => {
      setFormValues(values)
    })
    return () => subscription.unsubscribe()
  }, [watch, setFormValues])

  // Clear API error after successful submit
  React.useEffect(() => {
    if (isSubmitSuccessful) setApiError(null)
  }, [isSubmitSuccessful])

  // Helper to clear error on any field change
  function handleFieldChange() {
    if (apiError) setApiError(null)
  }

  // Fetch application list when popover opens
  React.useEffect(() => {
    if (!appOpen || !selectedTeam) return
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
        setAppOptions(apps)
        setAppLoading(false)
      })
      .catch(err => {
        setAppError(err.message || 'Failed to fetch applications')
        setAppLoading(false)
      })
  }, [appOpen, selectedTeam])

  async function onSubmit(values: CertificateAddFormValues) {
    // Prepare payload with all schema fields, using empty string for missing values
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
        payload.validTo = values.isAmexCert === 'No' && values.validTo ? values.validTo.toISOString().slice(0, 10) : ''
      } else if (key === 'isAmexCert') {
        payload.isAmexCert = values.isAmexCert === 'Yes' ? 'Yes' : 'No'
      } else {
        payload[key] = (values as any)[key] ?? ''
      }
    }
    // Add renewingTeamName from selectedTeam
    payload.renewingTeamName = selectedTeam || ''
    // Remove additional fields if showMore is false
    if (!showMore) {
      payload.serverName = ''
      payload.keystorePath = ''
      payload.uri = ''
    }
    try {
      const res = await fetch(CERTIFICATE_SAVE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let errorText = ''
        try {
          errorText = await res.text()
        } catch {}
        throw new Error(errorText || `Failed to add certificate: ${res.status} ${res.statusText}`)
      }
      toast.success('Certificate added successfully!', { description: 'The certificate has been saved.' })
      reset()
      resetForm()
      if (onSuccess) onSuccess()
      if (onCertificateAdded) onCertificateAdded()
    } catch (err: any) {
      let message = 'An error occurred while saving the certificate.'
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.'
      } else if (err?.message) {
        message = err.message
      }
      setApiError(message)
    }
  }

  // certificate type info helps user understand the difference
  const certTypeInfo = React.useMemo(() => {
    if (isAmexCert === 'Yes') {
      return {
        title: "Amex Certificate",
        description: "Internal certificates issued by American Express Certificate Authority",
        icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
        color: "border-blue-200 bg-blue-50/50"
      }
    } else {
      return {
        title: "Non-Amex Certificate",
        description: "External certificates issued by third-party Certificate Authorities",
        icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
        color: "border-emerald-200 bg-emerald-50/50"
      }
    }
  }, [isAmexCert])

  return (
    <TooltipProvider>
      <div className="h-full bg-gradient-to-b from-background to-muted/30">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6 overflow-y-auto h-full">
          <AnimatePresence>
            {apiError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-6"
          >
            {/* Page Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Add New Certificate</h1>
              <p className="text-muted-foreground text-lg">Create a new certificate entry in the system</p>
            </div>
            
            {/* Certificate Type Card */}
            <motion.div
              variants={fadeIn}
              transition={{ delay: 0.2 }}
            >
              <Card className={cn("border-2", certTypeInfo.color)}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    {certTypeInfo.icon}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{certTypeInfo.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{certTypeInfo.description}</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-sm font-medium",
                        isAmexCert === 'Yes'
                          ? "bg-blue-100 text-blue-800 border-blue-300" 
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      )}
                    >
                      {isAmexCert === 'Yes' ? 'Internal' : 'External'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
            
            {/* Primary Information Section */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <ClipboardList className="h-5 w-5" />
                  Primary Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  variants={staggerChildren}
                >
                  {/* Common Name */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Common Name 
                      <span className="text-destructive">*</span>
                    </label>
                    <Input 
                      {...register('commonName', { onChange: handleFieldChange })} 
                      placeholder="e.g., example.com or *.example.com" 
                      className={cn(
                        "h-11 transition-all duration-200 bg-background border-2",
                        errors.commonName 
                          ? "border-destructive focus-visible:ring-destructive/20" 
                          : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                      )}
                    />
                    {errors.commonName && (
                      <motion.p 
                        className="text-xs text-destructive font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {errors.commonName.message}
                      </motion.p>
                    )}
                  </motion.div>
                  
                  {/* Serial Number */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Serial Number 
                      <span className="text-destructive">*</span>
                    </label>
                    <Input 
                      {...register('serialNumber', { onChange: handleFieldChange })} 
                      placeholder="e.g., 00a1b2c3d4e5f6..." 
                      className={cn(
                        "h-11 font-mono text-sm transition-all duration-200 bg-background border-2",
                        errors.serialNumber 
                          ? "border-destructive focus-visible:ring-destructive/20" 
                          : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                      )}
                    />
                    {errors.serialNumber && (
                      <motion.p 
                        className="text-xs text-destructive font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {errors.serialNumber.message}
                      </motion.p>
                    )}
                  </motion.div>
                  
                  {/* Central ID */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Central ID 
                      <span className="text-destructive">*</span>
                    </label>
                    <Input 
                      {...register('centralID', { onChange: handleFieldChange })} 
                      placeholder="Enter Central ID" 
                      className={cn(
                        "h-11 transition-all duration-200 bg-background border-2",
                        errors.centralID 
                          ? "border-destructive focus-visible:ring-destructive/20" 
                          : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                      )}
                    />
                    {errors.centralID && (
                      <motion.p 
                        className="text-xs text-destructive font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {errors.centralID.message}
                      </motion.p>
                    )}
                  </motion.div>
                  
                  {/* Certificate Type */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Certificate Type 
                      <span className="text-destructive">*</span>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-80 p-3">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Certificate Types:</p>
                            <div className="space-y-1 text-xs">
                              <p><strong>Amex Certificate:</strong> Internal certificates issued by American Express CA.</p>
                              <p><strong>Non-Amex Certificate:</strong> External certificates issued by third-party CAs.</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Controller
                      name="isAmexCert"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={value => { field.onChange(value); handleFieldChange() }}
                        >
                          <SelectTrigger className={cn(
                            "h-11 transition-all duration-200 bg-background border-2",
                            errors.isAmexCert 
                              ? "border-destructive focus-visible:ring-destructive/20" 
                              : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                          )}>
                            <SelectValue placeholder="Select certificate type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                                Amex Certificate
                              </div>
                            </SelectItem>
                            <SelectItem value="No">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                Non-Amex Certificate
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.isAmexCert && (
                      <motion.p 
                        className="text-xs text-destructive font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {errors.isAmexCert.message}
                      </motion.p>
                    )}
                  </motion.div>
                  
                  {/* Application */}
                  <motion.div variants={itemVariants} className="lg:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Application 
                      <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      name="applicationName"
                      control={control}
                      render={({ field }) => (
                        <Popover open={appOpen} onOpenChange={setAppOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={appOpen}
                              className={cn(
                                "w-full h-11 justify-between transition-all duration-200 bg-background border-2",
                                errors.applicationName 
                                  ? "border-destructive focus-visible:ring-destructive/20" 
                                  : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                              )}
                            >
                              {appLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading applications...
                                </>
                              ) : appError ? (
                                <span className="text-destructive">Failed to load applications</span>
                              ) : field.value ? (
                                appOptions.find(opt => opt === field.value) || field.value
                              ) : (
                                <span className="text-muted-foreground">Select application</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder="Search application..." className="h-9" />
                              <CommandEmpty>No application found.</CommandEmpty>
                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {appLoading ? (
                                  <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </div>
                                ) : appError ? (
                                  <div className="flex items-center justify-center p-6 text-sm text-destructive">
                                    {appError}
                                  </div>
                                ) : (
                                  appOptions.map(app => (
                                    <CommandItem
                                      key={app}
                                      value={app}
                                      onSelect={() => {
                                        field.onChange(app)
                                        setAppOpen(false)
                                        handleFieldChange()
                                      }}
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', field.value === app ? 'opacity-100' : 'opacity-0')} />
                                      {app}
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.applicationName && (
                      <motion.p 
                        className="text-xs text-destructive font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {errors.applicationName.message}
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
            
            {/* Non-Amex Certificate Configuration */}
            {isAmexCert === 'No' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 border-emerald-200 bg-emerald-50/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <Calendar className="h-5 w-5" />
                      Certificate Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <motion.div 
                        variants={itemVariants}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <Controller
                          name="validTo"
                          control={control}
                          rules={{ required: 'Expiry Date is required' }}
                          render={({ field }) => (
                            <>
                              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                                Expiry Date 
                                <span className="text-destructive">*</span>
                              </label>
                              <DatePicker
                                placeholder="Select expiry date"
                                {...field}
                                onChange={date => { field.onChange(date); handleFieldChange() }}
                                value={field.value}
                                className={cn(
                                  "h-11 border-2",
                                  errors.validTo 
                                    ? "border-destructive" 
                                    : "border-border focus-visible:border-primary"
                                )}
                              />
                            </>
                          )}
                        />
                        {errors.validTo && (
                          <motion.p 
                            className="text-xs text-destructive font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {errors.validTo.message}
                          </motion.p>
                        )}
                      </motion.div>
                      
                      <motion.div 
                        variants={itemVariants}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                          Environment 
                          <span className="text-destructive">*</span>
                        </label>
                        <Controller
                          name="environment"
                          control={control}
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={value => { field.onChange(value); handleFieldChange() }}
                            >
                              <SelectTrigger className={cn(
                                "h-11 transition-all duration-200 bg-background border-2",
                                errors.environment 
                                  ? "border-destructive focus-visible:ring-destructive/20" 
                                  : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                              )}>
                                <SelectValue placeholder="Select environment" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="E1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    E1 (Production)
                                  </div>
                                </SelectItem>
                                <SelectItem value="E2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    E2 (Staging)
                                  </div>
                                </SelectItem>
                                <SelectItem value="E3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    E3 (Development)
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.environment && (
                          <motion.p 
                            className="text-xs text-destructive font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {errors.environment.message}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Comments Section */}
            <Card className="border-2 border-muted bg-muted/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Comments</label>
                  <Textarea 
                    {...register('comment')} 
                    placeholder="Add any relevant comments about this certificate..." 
                    rows={4} 
                    className="resize-none bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                  />
                  {errors.comment && (
                    <motion.p 
                      className="text-xs text-destructive font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {errors.comment.message}
                    </motion.p>
                  )}
                </motion.div>
              </CardContent>
            </Card>
            
            {/* Additional Options */}
            <Card className="border-2 border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Settings2 className="h-5 w-5" />
                    Server Configuration
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowMore(prev => !prev); handleFieldChange() }}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      showMore && "rotate-180"
                    )} />
                    <span className="ml-1">{showMore ? 'Hide' : 'Show'} Options</span>
                  </Button>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0">
                      <motion.div 
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        variants={staggerChildren}
                        initial="hidden"
                        animate="visible"
                      >
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Server Name</label>
                          <Input 
                            {...register('serverName', { onChange: handleFieldChange })} 
                            placeholder="e.g., srv-app-01" 
                            className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                          />
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Keystore Path</label>
                          <Input 
                            {...register('keystorePath', { onChange: handleFieldChange })} 
                            placeholder="e.g., /path/to/keystore" 
                            className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                          />
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">URI</label>
                          <Input 
                            {...register('uri', { onChange: handleFieldChange })} 
                            placeholder="e.g., https://example.com" 
                            className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                          />
                        </motion.div>
                      </motion.div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
            
            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-border"
              variants={fadeIn}
              transition={{ delay: 0.4 }}
            >
              <DrawerClose asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isSubmitting}
                  className="h-12 flex-1 sm:flex-none sm:min-w-[140px] border-2"
                >
                  Cancel
                </Button>
              </DrawerClose>
              
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-12 flex-1 sm:flex-none sm:min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Certificate...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Certificate
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </div>
    </TooltipProvider>
  )
}
