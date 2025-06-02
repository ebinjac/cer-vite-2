"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { SERVICEID_UPDATE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, CalendarIcon, Settings, Calendar as CalendarIconAlt, MessageSquare } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { ServiceId } from '@/hooks/use-serviceids'
import { useState, useEffect } from 'react'

const serviceIdUpdateSchema = z.object({
  env: z.string().min(1, 'Environment is required'),
  application: z.string().min(1, 'Application is required'),
  renewalProcess: z.string().min(1, 'Renewal Process is required'),
  comment: z.string().optional(),
  expDate: z.date({
    required_error: "Expiry date is required",
  }),
})

type ServiceIdUpdateValues = z.infer<typeof serviceIdUpdateSchema>

interface ServiceIdUpdateFormProps {
  serviceId: ServiceId
  onSuccess?: () => void
  onCancel?: () => void
}

// Helper function to normalize environment value
const normalizeEnvironment = (env: string): string => {
  const envMap: Record<string, string> = {
    'e1': 'E1',
    'e2': 'E2',
    'e3': 'E3',
    'prod': 'E1',
    'staging': 'E2'
  }
  return envMap[env.toLowerCase()] || env.toUpperCase()
}

// Helper function to normalize renewal process value
const normalizeRenewalProcess = (renewalProcess: string): string => {
  if (!renewalProcess) return 'Manual'
  const normalized = renewalProcess.toLowerCase().trim()
  if (normalized === 'automated' || normalized === 'auto') return 'Automated'
  if (normalized === 'manual' || normalized === 'man') return 'Manual'
  // Handle exact matches
  if (renewalProcess === 'Manual' || renewalProcess === 'Automated') return renewalProcess
  return 'Manual' // Default fallback
}

export default function ServiceIdUpdateForm({ serviceId, onSuccess, onCancel }: ServiceIdUpdateFormProps) {
  const { selectedTeam } = useTeamStore()
  const [appOptions, setAppOptions] = useState<string[]>([])
  const [appLoading, setAppLoading] = useState(true)
  const [appError, setAppError] = useState<string | null>(null)

  const form = useForm<ServiceIdUpdateValues>({
    resolver: zodResolver(serviceIdUpdateSchema),
    defaultValues: {
      env: normalizeEnvironment(serviceId.env),
      application: serviceId.application,
      renewalProcess: normalizeRenewalProcess(serviceId.renewalProcess),
      comment: serviceId.comment || '',
      expDate: serviceId.expDate ? new Date(serviceId.expDate) : undefined,
    },
  })

  // Fetch applications when component mounts or team changes
  useEffect(() => {
    if (!selectedTeam) return
    
    setAppLoading(true)
    setAppError(null)
    
    fetch(`${APPLICATION_LIST_API}?team=${selectedTeam}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch applications')
        const text = await res.text()
        let apps: string[] = []
        
        try {
          apps = JSON.parse(text)
        } catch {
          apps = text
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        }
        
        // Ensure the current application is included in the options
        if (serviceId.application && !apps.includes(serviceId.application)) {
          apps = [serviceId.application, ...apps]
        }
        
        setAppOptions(apps)
      })
      .catch(err => {
        setAppError(err.message || 'Failed to load applications')
      })
      .finally(() => {
        setAppLoading(false)
      })
  }, [selectedTeam, serviceId.application])

  async function onSubmit(data: ServiceIdUpdateValues) {
    try {
      const response = await fetch(`${SERVICEID_UPDATE_API}/${serviceId.svcid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          id: serviceId.id,
          renewingTeamName: selectedTeam,
          expDate: format(data.expDate, 'yyyy-MM-dd'),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update service ID')
      }

      toast.success('Service ID updated successfully')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to update service ID')
      console.error('Error:', error)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-2 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Update Service ID
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Service ID:</span>
          <span className="font-mono font-medium text-foreground bg-muted px-2 py-1 rounded">{serviceId.svcid}</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Settings className="h-4 w-4" />
              Basic Configuration
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="env"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="E1">E1 (Production)</SelectItem>
                        <SelectItem value="E2">E2 (Staging)</SelectItem>
                        <SelectItem value="E3">E3 (Development)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="renewalProcess"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Process</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select renewal process" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Automated">Automated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="application"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={appLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            appLoading 
                              ? 'Loading applications...' 
                              : appError 
                                ? 'Failed to load applications' 
                                : 'Select application'
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading applications...
                          </div>
                        </SelectItem>
                      ) : appError ? (
                        <SelectItem value="error" disabled>
                          {appError}
                        </SelectItem>
                      ) : appOptions.length > 0 ? (
                        appOptions.map(app => (
                          <SelectItem key={app} value={app}>
                            {app}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-apps" disabled>
                          No applications found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-4" />

          {/* Expiry Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              <CalendarIconAlt className="h-4 w-4" />
              Expiry Configuration
            </div>

            <FormField
              control={form.control}
              name="expDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-4" />

          {/* Additional Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="h-4 w-4" />
              Additional Information
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional comments or notes about this service ID..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Service ID
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
