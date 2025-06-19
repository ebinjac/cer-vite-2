import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DrawerClose } from '@/components/ui/drawer'
import { toast } from 'sonner'
import DatePicker from '../ui/DatePicker'
import { CERTIFICATE_UPDATE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Certificate } from '@/hooks/use-certificates'
import { CalendarIcon, MessageSquare, Settings } from 'lucide-react'

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
  certificateIdentifier: z.string().optional(), // Additional field for updating
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

export type CertificateUpdateFormValues = z.infer<typeof schema>

export function CertificateUpdateDrawerForm({ 
  certificate, 
  onSuccess, 
  onCertificateUpdated
}: { 
  certificate: Certificate | null,
  onSuccess?: () => void, 
  onCertificateUpdated?: () => void
}) {
  const [showMore, setShowMore] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm<CertificateUpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isAmexCert: (certificate?.isAmexCert === 'Yes' ? 'Yes' : 'No') as 'Yes' | 'No',
      commonName: certificate?.commonName || '',
      serialNumber: certificate?.serialNumber || '',
      centralID: certificate?.centralID || '',
      applicationName: certificate?.applicationName || '',
      comment: certificate?.comment || '',
      serverName: certificate?.serverName || '',
      keystorePath: certificate?.keystorePath || '',
      uri: certificate?.uri || '',
      environment: certificate?.environment || '',
      certificateIdentifier: certificate?.certificateIdentifier || '',
      // Convert validTo string to Date object if it exists
      validTo: certificate?.validTo ? new Date(certificate.validTo) : undefined,
    },
  })

  // Set showMore based on whether the certificate has additional details
  React.useEffect(() => {
    if (certificate?.serverName || certificate?.keystorePath || certificate?.uri) {
      setShowMore(true)
    }
  }, [certificate])

  const isAmexCert = watch('isAmexCert')
  const { selectedTeam } = useTeamStore()
  const [appOptions, setAppOptions] = React.useState<string[]>([])
  const [appLoading, setAppLoading] = React.useState(false)
  const [appError, setAppError] = React.useState<string | null>(null)
  const [appOpen, setAppOpen] = React.useState(false)

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

  const onSubmit: SubmitHandler<CertificateUpdateFormValues> = async (values) => {
    if (!certificate?.certificateIdentifier) {
      setApiError('Certificate identifier is missing')
      return
    }

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
        // Use original value for isAmexCert as it cannot be changed
        payload.isAmexCert = certificate?.isAmexCert || values.isAmexCert
      } else if (key === 'commonName' || key === 'serialNumber') {
        // Use original values for read-only fields
        payload[key] = certificate?.[key as keyof Certificate] || ''
      } else {
        payload[key] = (values as any)[key] ?? ''
      }
    }
    
    // Add certificateIdentifier to the payload
    payload.certificateIdentifier = certificate.certificateIdentifier
    
    // Add renewingTeamName from selectedTeam
    payload.renewingTeamName = selectedTeam || certificate?.renewingTeamName || ''
    
    // Remove additional fields if showMore is false
    if (!showMore) {
      payload.serverName = ''
      payload.keystorePath = ''
      payload.uri = ''
    }

    try {
      const res = await fetch(CERTIFICATE_UPDATE_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let errorText = ''
        try {
          errorText = await res.text()
        } catch {}
        throw new Error(errorText || `Failed to update certificate: ${res.status} ${res.statusText}`)
      }
      toast.success('Certificate updated successfully!', { description: 'The certificate has been updated.' })
      if (onSuccess) onSuccess()
      if (onCertificateUpdated) onCertificateUpdated()
    } catch (err: any) {
      let message = 'An error occurred while updating the certificate.'
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.'
      } else if (err?.message) {
        message = err.message
      }
      setApiError(message)
    }
  }

  if (!certificate) {
    return <div className="p-8 text-center text-muted-foreground">No certificate selected for update</div>
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Common Name:</span>
          <code className="font-mono font-medium text-foreground bg-muted px-2 py-1 rounded">{certificate.commonName}</code>
        </div>
      </div>

      {apiError && (
        <div className="bg-destructive/15 text-destructive border border-destructive/20 px-3 py-2 rounded-md mb-4 text-sm">
          {apiError}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm mb-6">
        <p className="font-medium">Important Notes:</p>
        <ul className="list-disc ml-4 mt-1 space-y-0.5">
          <li>Common Name and Serial Number cannot be changed through this form</li>
          <li>Certificate Type cannot be modified</li>
          <li>For Non-Amex certificates, you can update the expiry date</li>
          <li>To change Serial Number, please use the renewal flow</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-primary">
            <Check className="h-4 w-4" />
            Basic Information
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/50 rounded-lg p-3">
            <div>
              <label className="text-sm font-medium">Common Name</label>
              <Input 
                value={certificate.commonName || ''} 
                disabled
                className="bg-background/50 text-muted-foreground mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Cannot be modified</p>
            </div>
            <div>
              <label className="text-sm font-medium">Serial Number</label>
              <Input 
                value={certificate.serialNumber || ''} 
                disabled
                className="bg-background/50 text-muted-foreground mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Can only be changed via renewal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/50 rounded-lg p-3">
            <div>
              <label className="text-sm font-medium">Central ID</label>
              <Input 
                {...register('centralID', { onChange: handleFieldChange })} 
                placeholder="Central ID" 
                className="bg-background mt-1"
              />
              {errors.centralID && <p className="text-xs text-destructive mt-1">{errors.centralID.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Type of Cert</label>
              <Input 
                value={certificate.isAmexCert === 'Yes' ? 'Amex cert' : 'Non Amex'} 
                disabled
                className="bg-background/50 text-muted-foreground mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Cannot be modified</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <label className="text-sm font-medium">Application</label>
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
                      className="w-full justify-between mt-1 bg-background"
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
            {errors.applicationName && <p className="text-xs text-destructive mt-1">{errors.applicationName.message}</p>}
          </div>
        </div>

        {/* Non-Amex Certificate Options */}
        {certificate.isAmexCert === 'No' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <CalendarIcon className="h-4 w-4" />
              Certificate Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/50 rounded-lg p-3">
              <div>
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
                {errors.validTo && <p className="text-xs text-destructive mt-1">{errors.validTo.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Environment</label>
                <Controller
                  name="environment"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={value => { field.onChange(value); handleFieldChange() }}
                    >
                      <SelectTrigger className="mt-1 bg-background">
                        <SelectValue placeholder="Select Environment" />
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
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
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
                {errors.environment && <p className="text-xs text-destructive mt-1">{errors.environment.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-primary">
            <MessageSquare className="h-4 w-4" />
            Additional Information
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <label className="text-sm font-medium">Comments</label>
            <Textarea 
              {...register('comment')} 
              placeholder="Add any additional comments or notes..." 
              className="mt-1 resize-none h-20 bg-background" 
              rows={2}
            />
            {errors.comment && <p className="text-xs text-destructive mt-1">{errors.comment.message}</p>}
          </div>
        </div>

        {/* Additional Options Toggle */}
        <div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => { setShowMore(v => !v); handleFieldChange() }}
            className="text-primary"
          >
            {showMore ? 'Hide Additional Options' : 'Add More Options'}
          </Button>
        </div>

        {/* Additional Options Section */}
        {showMore && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <Settings className="h-4 w-4" />
              Additional Options
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/50 rounded-lg p-3">
              <div>
                <label className="text-sm font-medium">Server Name</label>
                <Input 
                  {...register('serverName', { onChange: handleFieldChange })} 
                  placeholder="Server Name" 
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Key Store Path</label>
                <Input 
                  {...register('keystorePath', { onChange: handleFieldChange })} 
                  placeholder="Key Store Path" 
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium">URI</label>
                <Input 
                  {...register('uri', { onChange: handleFieldChange })} 
                  placeholder="URI" 
                  className="mt-1 bg-background"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-3 border-t">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="min-w-[100px]">
              Cancel
            </Button>
          </DrawerClose>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Update Certificate
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 