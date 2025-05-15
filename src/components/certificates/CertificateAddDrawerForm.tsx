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
import { AlertCircle, Check, ChevronDown, ChevronsUpDown, ClipboardList, HelpCircle, Info, Loader2, Plus, Server } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCertificateAddFormStore } from '@/store/certificate-add-form-store'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion, AnimatePresence } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
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
  function handleFieldChange () {
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
        description: "Certificates procured within American Express and signed by internal Certificate Authority (CA).",
        color: "bg-blue-50 border-blue-200 text-blue-700"
      }
    } else {
      return {
        title: "Non-Amex Certificate",
        description: "External certificates not issued by American Express, but by third-party Certificate Authorities.",
        color: "bg-green-50 border-green-200 text-green-700"
      }
    }
  }, [isAmexCert])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 overflow-y-auto">
      <AnimatePresence>
        {apiError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">New Certificate</h2>
            <p className="text-muted-foreground text-sm mt-1">Add a new certificate to the system</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1 items-center text-sm",
              isAmexCert === 'Yes'
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-green-50 text-green-700 border-green-200"
            )}
          >
            {isAmexCert === 'Yes' ? 'Amex Certificate' : 'Non-Amex Certificate'}
          </Badge>
        </div>
        
        {/* Certificate Type Info Card */}
        <motion.div
          variants={fadeIn}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-md border p-4",
            certTypeInfo.color
          )}
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">{certTypeInfo.title}</h4>
              <p className="text-sm mt-1">{certTypeInfo.description}</p>
              <div className="text-xs mt-2 font-medium">
                {isAmexCert === 'Yes' 
                  ? "Used for internal applications and services within the American Express ecosystem."
                  : "Used for public-facing applications and services requiring trusted third-party validation."
                }
              </div>
            </div>
          </div>
        </motion.div>
        
        <div>
          <div className="flex items-center mb-4">
            <h3 className="text-base font-medium flex items-center">
              <ClipboardList className="h-4 w-4 mr-2 text-primary" />
              Primary Information
            </h3>
            <Separator className="flex-1 ml-3" />
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-1"
            variants={staggerChildren}
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1.5">
                Common Name <span className="text-red-500">*</span>
              </label>
              <Input 
                {...register('commonName', { onChange: handleFieldChange })} 
                placeholder="e.g., example.com" 
                className={cn(
                  "transition-all duration-200",
                  errors.commonName && "ring-1 ring-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.commonName && (
                <motion.p 
                  className="text-xs text-red-500 mt-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.commonName.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1.5">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <Input 
                {...register('serialNumber', { onChange: handleFieldChange })} 
                placeholder="e.g., 00a1b2c3d4e5f6..." 
                className={cn(
                  "font-mono text-sm transition-all duration-200",
                  errors.serialNumber && "ring-1 ring-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.serialNumber && (
                <motion.p 
                  className="text-xs text-red-500 mt-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.serialNumber.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1.5">
                Central ID <span className="text-red-500">*</span>
              </label>
              <Input 
                {...register('centralID', { onChange: handleFieldChange })} 
                placeholder="Central ID" 
                className={cn(
                  "transition-all duration-200",
                  errors.centralID && "ring-1 ring-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.centralID && (
                <motion.p 
                  className="text-xs text-red-500 mt-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.centralID.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1.5 flex items-center">
                Type of Certificate <span className="text-red-500">*</span>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-80">
                      <p className="text-sm">
                        <strong>Amex Certificate:</strong> Internal certificates issued by American Express CA.
                        <br /><br />
                        <strong>Non-Amex Certificate:</strong> External certificates issued by third-party CAs.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                      "transition-all duration-200",
                      errors.isAmexCert && "ring-1 ring-red-500 focus-visible:ring-red-500"
                    )}>
                      <SelectValue placeholder="Type of Certificate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Amex Certificate</SelectItem>
                      <SelectItem value="No">Non-Amex Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.isAmexCert && (
                <motion.p 
                  className="text-xs text-red-500 mt-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.isAmexCert.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1.5">
                Application <span className="text-red-500">*</span>
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
                          "w-full justify-between transition-all duration-200",
                          errors.applicationName && "ring-1 ring-red-500 focus-visible:ring-red-500"
                        )}
                      >
                        {appLoading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
                        ) : appError ? (
                          'Failed to load applications'
                        ) : field.value ? (
                          appOptions.find(opt => opt === field.value) || field.value
                        ) : (
                          'Select application'
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search application..." />
                        <CommandEmpty>No application found.</CommandEmpty>
                        <CommandGroup>
                          {appLoading ? (
                            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...
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
                  className="text-xs text-red-500 mt-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.applicationName.message}
                </motion.p>
              )}
            </motion.div>
            
            {isAmexCert === 'No' && (
              <>
                <motion.div 
                  variants={itemVariants}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Controller
                    name="validTo"
                    control={control}
                    rules={{ required: 'Expiry Date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        label="Expiry Date"
                        description="Select expiry date"
                        placeholder="Pick a date"
                        {...field}
                        onChange={date => { field.onChange(date); handleFieldChange() }}
                        value={field.value}
                      />
                    )}
                  />
                  {errors.validTo && (
                    <motion.p 
                      className="text-xs text-red-500 mt-1.5"
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
                >
                  <label className="block text-sm font-medium mb-1.5">
                    Environment <span className="text-red-500">*</span>
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
                          "transition-all duration-200",
                          errors.environment && "ring-1 ring-red-500 focus-visible:ring-red-500"
                        )}>
                          <SelectValue placeholder="Select Environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="E1">E1</SelectItem>
                          <SelectItem value="E2">E2</SelectItem>
                          <SelectItem value="E3">E3</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.environment && (
                    <motion.p 
                      className="text-xs text-red-500 mt-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {errors.environment.message}
                    </motion.p>
                  )}
                </motion.div>
              </>
            )}
            
            <motion.div 
              variants={itemVariants}
              className="md:col-span-2"
            >
              <label className="block text-sm font-medium mb-1.5">Comments</label>
              <Textarea 
                {...register('comment')} 
                placeholder="Add any relevant comments about this certificate" 
                rows={3} 
                className="resize-none"
              />
              {errors.comment && (
                <motion.p 
                  className="text-xs text-red-500 mt-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.comment.message}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </div>
        
        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setShowMore(prev => !prev); handleFieldChange() }}
            className="px-0 font-medium text-primary flex items-center hover:bg-transparent hover:text-primary/80"
          >
            <div className="flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Additional Options
            </div>
            <ChevronDown className={cn(
              "ml-1 h-4 w-4 transition-transform duration-200",
              showMore && "rotate-180"
            )} />
          </Button>
          
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-1 pt-2"
                  variants={staggerChildren}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1.5">Server Name</label>
                    <Input 
                      {...register('serverName', { onChange: handleFieldChange })} 
                      placeholder="e.g., srv-app-01" 
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1.5">Key Store Path</label>
                    <Input 
                      {...register('keystorePath', { onChange: handleFieldChange })} 
                      placeholder="e.g., /path/to/keystore" 
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1.5">URI</label>
                    <Input 
                      {...register('uri', { onChange: handleFieldChange })} 
                      placeholder="e.g., https://example.com" 
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Separator className="my-4" />
        
        <motion.div 
          className="flex gap-3 pt-3 justify-between"
          variants={fadeIn}
          transition={{ delay: 0.4 }}
        >
          <DrawerClose asChild>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSubmitting}
              className="flex-1 max-w-[150px]"
            >
              Cancel
            </Button>
          </DrawerClose>
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 bg-green-600 hover:bg-green-700 max-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Certificate'
            )}
          </Button>
        </motion.div>
      </motion.div>
    </form>
  )
} 