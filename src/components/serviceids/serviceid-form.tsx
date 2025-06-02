import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { SERVICEID_CREATE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
import { useTeamStore } from '@/store/team-store'
import { useQuery } from '@tanstack/react-query'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

const serviceIdFormSchema = z.object({
  svcid: z.string().min(3, 'Service ID must be at least 3 characters'),
  env: z.string().min(1, 'Environment is required'),
  application: z.string().min(1, 'Application is required'),
  renewalProcess: z.string().min(1, 'Renewal Process is required'),
  comment: z.string().optional(),
  expDate: z.date({
    required_error: "Expiry date is required",
  }),
})

type ServiceIdFormValues = z.infer<typeof serviceIdFormSchema>

interface ServiceIdFormProps {
  onSuccess?: () => void
}

export default function ServiceIdForm({ onSuccess }: ServiceIdFormProps) {
  const { selectedTeam } = useTeamStore()
  const form = useForm<ServiceIdFormValues>({
    resolver: zodResolver(serviceIdFormSchema),
    defaultValues: {
      svcid: '',
      env: '',
      application: '',
      renewalProcess: '',
      comment: '',
    },
  })

  // Application dropdown logic (like CertificateAddDrawerForm)
  const [appOptions, setAppOptions] = useState<string[]>([])
  const [appLoading, setAppLoading] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)
  const [appOpen, setAppOpen] = useState(false)

  useEffect(() => {
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

  async function onSubmit(data: ServiceIdFormValues) {
    try {
      const response = await fetch(SERVICEID_CREATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          renewingTeamName: selectedTeam,
          expDate: format(data.expDate, 'yyyy-MM-dd'),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create service ID')
      }

      toast.success('Service ID created successfully')
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create service ID')
      console.error('Error:', error)
    }
  }

  if (!selectedTeam) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please select a team first
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M10 2a3 3 0 0 1 3 3v1h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a3 3 0 0 1 3-3Z" />
            </svg>
            Basic Information
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="svcid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter service ID" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="env"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    open={appOpen}
                    onOpenChange={setAppOpen}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={appLoading ? 'Loading applications...' : appError ? 'Failed to load applications' : 'Select application'} />
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
                        <SelectItem value="error" disabled>{appError}</SelectItem>
                      ) : appOptions.length > 0 ? (
                        appOptions.map(app => (
                          <SelectItem key={app} value={app}>{app}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-apps" disabled>No applications found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Expiry Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <CalendarIcon className="h-4 w-4" />
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
                        variant={"outline"}
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

        {/* Additional Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M7 8h6M7 12h6M5 16h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
            </svg>
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
        <div className="flex justify-end pt-4 sticky bottom-0 bg-background py-4 border-t">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Service ID
          </Button>
        </div>
      </form>
    </Form>
  )
} 