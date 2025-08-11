import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DrawerClose } from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import DatePicker from '../ui/DatePicker'
import { CERTIFICATE_UPDATE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Check, 
  ChevronsUpDown, 
  Loader2, 
  Info, 
  AlertCircle, 
  Calendar, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  User,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Certificate } from '@/hooks/use-certificates'

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
  certificateIdentifier: z.string().optional(),
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
  const [showAdditional, setShowAdditional] = React.useState(false)
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
      validTo: certificate?.validTo ? new Date(certificate.validTo) : undefined,
    },
  })

  React.useEffect(() => {
    if (certificate?.serverName || certificate?.keystorePath || certificate?.uri) {
      setShowAdditional(true)
    }
  }, [certificate])

  const isAmexCert = watch('isAmexCert')
  const { selectedTeam } = useTeamStore()
  const [appOptions, setAppOptions] = React.useState<string[]>([])
  const [appLoading, setAppLoading] = React.useState(false)
  const [appError, setAppError] = React.useState<string | null>(null)
  const [appOpen, setAppOpen] = React.useState(false)

  React.useEffect(() => {
    if (isSubmitSuccessful) setApiError(null)
  }, [isSubmitSuccessful])

  function handleFieldChange() {
    if (apiError) setApiError(null)
  }

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
        payload.isAmexCert = certificate?.isAmexCert || values.isAmexCert
      } else if (key === 'commonName' || key === 'serialNumber') {
        payload[key] = certificate?.[key as keyof Certificate] || ''
      } else {
        payload[key] = (values as any)[key] ?? ''
      }
    }
    
    payload.certificateIdentifier = certificate.certificateIdentifier
    payload.renewingTeamName = selectedTeam || certificate?.renewingTeamName || ''
    
    if (!showAdditional) {
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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-medium text-foreground">No Certificate Selected</h3>
            <p className="text-sm text-muted-foreground">Please select a certificate to update</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 border-l-4 border-l-primary pl-4 bg-primary/5 py-3 pr-4 rounded-r">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Update Certificate</h2>
            <p className="text-sm text-muted-foreground font-mono mt-1">{certificate.commonName}</p>
          </div>
          <Badge 
            variant={certificate.isAmexCert === 'Yes' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {certificate.isAmexCert === 'Yes' ? 'Amex Certificate' : 'Non-Amex Certificate'}
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Update Guidelines:</span> Common Name and Serial Number are read-only. 
          Certificate Type cannot be modified. Use renewal flow to change Serial Number.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <User className="h-4 w-4" />
            <span>Basic Information</span>
          </div>

          {/* Read-only fields */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Common Name (Read-only)
                </Label>
                <Input 
                  value={certificate.commonName || ''} 
                  disabled 
                  className="bg-background/50 border-dashed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Serial Number (Read-only)
                </Label>
                <Input 
                  value={certificate.serialNumber || ''} 
                  disabled 
                  className="bg-background/50 border-dashed"
                />
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="centralID" className="flex items-center gap-1">
                Central ID <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="centralID"
                {...register('centralID', { onChange: handleFieldChange })}
                placeholder="Enter Central ID"
                className="border-primary/20 focus:border-primary"
              />
              {errors.centralID && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.centralID.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Certificate Type (Fixed)
              </Label>
              <div className="px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm">
                {certificate.isAmexCert === 'Yes' ? 'Amex Certificate' : 'Non-Amex Certificate'}
              </div>
            </div>
          </div>

          {/* Application Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Application <span className="text-destructive">*</span>
            </Label>
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
                      className="w-full justify-between border-primary/20 hover:border-primary"
                    >
                      {appLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading applications...
                        </>
                      ) : appError ? (
                        <span className="text-destructive">Failed to load applications</span>
                      ) : field.value ? (
                        field.value
                      ) : (
                        <span className="text-muted-foreground">Select application</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search applications..." />
                      <CommandEmpty>No application found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {appLoading ? (
                          <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        ) : appError ? (
                          <div className="p-6 text-center">
                            <span className="text-sm text-destructive">{appError}</span>
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
                              <Check className={cn(
                                "mr-2 h-4 w-4",
                                field.value === app ? "opacity-100" : "opacity-0"
                              )} />
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
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.applicationName.message}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Non-Amex Configuration */}
        {certificate.isAmexCert === 'No' && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
                <Calendar className="h-4 w-4" />
                <span>Certificate Configuration</span>
              </div>

              <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Expiry Date <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="validTo"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label=""
                          description=""
                          placeholder="Select expiry date"
                          {...field}
                          onChange={date => { 
                            field.onChange(date); 
                            handleFieldChange() 
                          }}
                          value={field.value}
                        />
                      )}
                    />
                    {errors.validTo && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.validTo.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Environment <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="environment"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={value => { 
                            field.onChange(value); 
                            handleFieldChange() 
                          }}
                        >
                          <SelectTrigger className="border-secondary/40 focus:border-secondary">
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="E1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>E1 (Production)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="E2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span>E2 (Staging)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="E3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>E3 (Development)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.environment && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.environment.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Comments Section */}
        <div className="space-y-3">
          <Label htmlFor="comment">Comments & Notes</Label>
          <Textarea 
            id="comment"
            {...register('comment')} 
            placeholder="Add any additional comments or notes about this certificate..."
            className="resize-none border-muted-foreground/20 focus:border-primary"
            rows={3}
          />
          {errors.comment && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.comment.message}
            </p>
          )}
        </div>

        <Separator />

        {/* Additional Options */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => { 
              setShowAdditional(!showAdditional); 
              handleFieldChange() 
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
          >
            {showAdditional ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Settings className="h-4 w-4" />
            <span>Additional Options</span>
            <span className="text-xs">({showAdditional ? 'Hide' : 'Show'})</span>
          </Button>

          {showAdditional && (
            <div className="bg-accent/30 border border-accent/40 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input 
                    id="serverName"
                    {...register('serverName', { onChange: handleFieldChange })} 
                    placeholder="Enter server name"
                    className="border-accent/40 focus:border-accent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keystorePath">Keystore Path</Label>
                  <Input 
                    id="keystorePath"
                    {...register('keystorePath', { onChange: handleFieldChange })} 
                    placeholder="Enter keystore path"
                    className="border-accent/40 focus:border-accent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uri">URI</Label>
                  <Input 
                    id="uri"
                    {...register('uri', { onChange: handleFieldChange })} 
                    placeholder="Enter URI"
                    className="border-accent/40 focus:border-accent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t bg-background/95 backdrop-blur sticky bottom-0 py-4">
          <DrawerClose asChild>
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </DrawerClose>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            size="lg"
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
