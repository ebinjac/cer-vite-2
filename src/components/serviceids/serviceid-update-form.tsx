"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { SERVICEID_UPDATE_API, APPLICATION_LIST_API } from '@/lib/api-endpoints'
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
import type { ServiceId } from '@/hooks/use-serviceids'

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
  }
  return envMap[env.toLowerCase()] || env
}

export default function ServiceIdUpdateForm({ serviceId, onSuccess, onCancel }: ServiceIdUpdateFormProps) {
  const { selectedTeam } = useTeamStore()

  // Add debugging logs for selectedTeam
  console.log('Selected Team:', selectedTeam)

  const form = useForm<ServiceIdUpdateValues>({
    resolver: zodResolver(serviceIdUpdateSchema),
    defaultValues: {
      env: normalizeEnvironment(serviceId.env),
      application: serviceId.application,
      renewalProcess: serviceId.renewalProcess,
      comment: serviceId.comment,
      expDate: serviceId.expDate ? new Date(serviceId.expDate) : undefined,
    },
  })

  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications', selectedTeam],
    queryFn: async () => {
      // Add debugging log for API URL
      const apiUrl = `${APPLICATION_LIST_API}?team=${selectedTeam}`
      console.log('API URL:', apiUrl)
      
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      
      // Add debugging log for API response
      console.log('Applications API Response:', data)
      return data
    },
    enabled: !!selectedTeam,
  })

  // Add debugging log for applications query state
  console.log('Applications Query State:', {
    data: applications,
    isLoading: isLoadingApplications,
    selectedTeam
  })

  async function onSubmit(data: ServiceIdUpdateValues) {
    try {
      const response = await fetch(`${SERVICEID_UPDATE_API}/${serviceId.svcid}`, {
        method: 'PUT',
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-muted-foreground">Service ID:</span>
          <span className="font-medium">{serviceId.svcid}</span>
        </div>

        <FormField
          control={form.control}
          name="env"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Environment</FormLabel>
              <Select onValueChange={field.onChange} value={normalizeEnvironment(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="E1">E1</SelectItem>
                  <SelectItem value="E2">E2</SelectItem>
                  <SelectItem value="E3">E3</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="application"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingApplications}>
                    <SelectValue placeholder={
                      isLoadingApplications 
                        ? "Loading applications..." 
                        : "Select application"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingApplications ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : applications && applications.length > 0 ? (
                    applications.map((app: string) => (
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
                  <SelectItem value="Automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional comments"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
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
  )
} 