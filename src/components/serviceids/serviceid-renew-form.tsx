'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DrawerClose } from '@/components/ui/drawer'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ServiceId } from '@/hooks/use-serviceids'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertCircle, Loader2, RefreshCw, CheckCircle } from 'lucide-react'
import { SERVICEID_RENEW_API } from '@/lib/api-endpoints'
import DatePicker from '@/components/ui/DatePicker'
import { format, isAfter, isBefore } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTeamStore } from '@/store/team-store'
import { useQueryClient } from '@tanstack/react-query'
import { useServiceIds } from '@/hooks/use-serviceids'
import { useNavigate } from '@tanstack/react-router'
import { CopyButton } from '@/components/ui/copy-button'

// Define form value types
interface RenewalFormValues {
  changeNumber?: string
  expiryDate?: Date
  selectedServiceIdId?: string
  comment: string
}

interface ServiceIdRenewFormProps {
  serviceId: ServiceId | null
  withPlanning: boolean
  onSuccess?: () => void
  onServiceIdRenewed?: () => void
}

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
  selected: { 
    scale: 1.02, 
    boxShadow: "0 0 0 2px #3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.05)"
  }
}

// Motion components
const MotionAlert = motion(Alert)
const MotionRadioGroup = motion(RadioGroup)

// Update RenewalStep interface to include planning specific steps
interface RenewalStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

export function ServiceIdRenewForm({
  serviceId,
  withPlanning,
  onSuccess,
  onServiceIdRenewed,
}: ServiceIdRenewFormProps) {
  const navigate = useNavigate()
  const drawerRef = React.useRef<HTMLFormElement>(null)
  const { refetchServiceIds } = useServiceIds()
  const [isRenewing, setIsRenewing] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [showMoreOptions, setShowMoreOptions] = React.useState(false)
  const [renewalSteps, setRenewalSteps] = React.useState<RenewalStep[]>(() => {
    if (withPlanning) {
      return [
        {
          id: 'initiate',
          title: 'Adding to Planning',
          description: 'Adding service ID to renewal planning',
          status: 'pending'
        },
        {
          id: 'redirect',
          title: 'Redirecting',
          description: 'Taking you to the planning page',
          status: 'pending'
        }
      ]
    }
    return [
      {
        id: 'initiate',
        title: 'Initiating Renewal',
        description: 'Starting the service ID renewal process',
        status: 'pending'
      },
      {
        id: 'complete',
        title: 'Completing Renewal',
        description: 'Finalizing the service ID renewal',
        status: 'pending'
      },
      {
        id: 'refresh',
        title: 'Refreshing Data',
        description: 'Updating service ID information',
        status: 'pending'
      }
    ]
  })

  // Function to close the drawer
  const closeDrawer = React.useCallback(() => {
    const drawerCloseButton = drawerRef.current?.querySelector('[data-drawer-close]') as HTMLButtonElement | null
    if (drawerCloseButton) {
      drawerCloseButton.click()
    }
  }, [])

  // Function to handle planning renewal success
  const handlePlanningSuccess = React.useCallback(async () => {
    try {
      console.log('Handling planning renewal success...')
      
      // Show success toast
      toast.success('Service ID added to planning!', { 
        description: 'You will be redirected to the planning page.',
        duration: 3000
      })
      
      // Update second step status
      updateStepStatus('redirect', 'in-progress')
      
      // Small delay to show the success state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Close the drawer
      closeDrawer()
      
      // Call the callbacks
      if (onServiceIdRenewed) {
        onServiceIdRenewed()
      }
      if (onSuccess) {
        onSuccess()
      }
      
      // Update final step status
      updateStepStatus('redirect', 'completed')
      
      // Navigate to planning page using TanStack Router
      navigate({ to: '/planning' })
      
    } catch (error) {
      console.error('Error during planning success handling:', error)
      updateStepStatus('redirect', 'error')
      toast.error('Error redirecting to planning page', {
        description: 'Please navigate to the planning page manually.',
        duration: 5000
      })
      // Still close drawer and call callbacks
      closeDrawer()
      if (onServiceIdRenewed) onServiceIdRenewed()
      if (onSuccess) onSuccess()
    }
  }, [navigate, closeDrawer, onServiceIdRenewed, onSuccess])

  // Helper function to update step status
  const updateStepStatus = (stepId: string, status: RenewalStep['status']) => {
    setRenewalSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    )
  }

  const onSubmit: SubmitHandler<RenewalFormValues> = async (values) => {
    if (!serviceId?.svcid) {
      setApiError('Service ID identifier is missing')
      return
    }
    
    if (!validateForm(values)) {
      setApiError('Please provide all required fields')
      return
    }
    
    try {
      setIsRenewing(true)
      setApiError(null)
      
      // Reset steps
      setRenewalSteps(steps => steps.map(step => ({ ...step, status: 'pending' })))
      
      // Update first step status
      updateStepStatus('initiate', 'in-progress')
      
      // Get current date in YYYY-MM-DD format for renewalDate
      const today = new Date()
      const renewalDate = format(today, 'yyyy-MM-dd')
      
      // Format validTo date
      const validTo = values.expiryDate 
        ? format(values.expiryDate, 'yyyy-MM-dd')
        : ""
      
      // Prepare payload for API call
      const payload = {
        changeNumber: values.changeNumber || '',
        svcid: serviceId.svcid,
        expiryDate: validTo,
        checklist: "0,0,0,0,0,0,0,0,0,0,0,0",
        comment: values.comment || "",
        currentStatus: "pending",
        renewalDate: renewalDate,
        renewedBy: "",
        validTo: validTo,
        withPlanning: true // Add flag for planning
      }
      
      console.log('Service ID renewal payload:', payload)
      
      // Send the API request
      const res = await fetch(SERVICEID_RENEW_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        updateStepStatus('initiate', 'error')
        let errorText = ''
        try {
          errorText = await res.text()
        } catch {}
        throw new Error(errorText || `Failed to add service ID to planning: ${res.status} ${res.statusText}`)
      }
      
      // Mark first step as completed
      updateStepStatus('initiate', 'completed')
      
      if (withPlanning) {
        // Handle planning flow success
        await handlePlanningSuccess()
      } else {
        // Handle immediate renewal flow
        const initiateData = await res.json()
        
        if (!initiateData.renewId) {
          throw new Error('Failed to get renewal ID from server response')
        }
        
        // Mark second step as completed and start refresh step
        updateStepStatus('complete', 'completed')
        updateStepStatus('refresh', 'in-progress')
        
        // Get the success message directly from the text response
        const successMessage = await res.text()
        
        // Handle successful renewal
        await handleRenewalSuccess(successMessage)
        
        // Mark refresh step as completed
        updateStepStatus('refresh', 'completed')
      }
      
    } catch (err: any) {
      setIsRenewing(false)
      let message = 'An error occurred while processing the service ID.'
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.'
      } else if (err?.message) {
        message = err.message
      }
      setApiError(message)
      toast.error(withPlanning ? 'Failed to add to planning' : 'Service ID renewal failed', {
        description: message,
        duration: 5000
      })
    } finally {
      setIsRenewing(false)
    }
  }

  // Form without zod resolver
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm<RenewalFormValues>({
    defaultValues: {
      changeNumber: '',
      expiryDate: new Date(),
      selectedServiceIdId: '',
      comment: 'Renewed the service ID',
    },
  })
  
  // Watch form values
  const expiryDate = watch('expiryDate');
  const comment = watch('comment');

  // Clear API error after successful submit
  React.useEffect(() => {
    if (isSubmitSuccessful) setApiError(null)
  }, [isSubmitSuccessful])

  // Helper to clear error on any field change
  function handleFieldChange() {
    if (apiError) setApiError(null)
  }

  // Custom validation function
  const validateForm = (values: RenewalFormValues): boolean => {
    let isValid = true;
    
    // Required fields
    if (!values.expiryDate) {
      isValid = false;
    }
    
    return isValid;
  };

  if (!serviceId) {
    return <div className="p-8 text-center text-muted-foreground">No service ID selected for renewal</div>
  }

  // Calculate expiry date display
  const expiryDateDisplay = serviceId.expDate ? new Date(serviceId.expDate).toLocaleDateString() : 'N/A';
  
  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setValue('expiryDate', date || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    handleFieldChange();
  };

  // Keep the original handleRenewalSuccess function
  const handleRenewalSuccess = React.useCallback(async (message: string) => {
    try {
      console.log('Handling successful renewal...')
      
      // First refresh the data
      await refetchServiceIds()
      console.log('Service ID data refreshed')
      
      // Then show the success toast
      toast.success('Service ID renewed successfully!', { 
        description: message,
        duration: 5000
      })
      console.log('Success toast shown')
      
      // Then close the drawer
      closeDrawer()
      console.log('Drawer closed')
      
      // Finally call the callbacks
      if (onServiceIdRenewed) {
        onServiceIdRenewed()
      }
      if (onSuccess) {
        onSuccess()
      }
      console.log('Callbacks executed')
    } catch (error) {
      console.error('Error during renewal success handling:', error)
      // Show error toast but don't prevent drawer from closing
      toast.error('Error refreshing service ID data', {
        description: 'The renewal was successful, but there was an error refreshing the data. Please refresh the page.',
        duration: 5000
      })
      // Still close drawer and call callbacks
      closeDrawer()
      if (onServiceIdRenewed) onServiceIdRenewed()
      if (onSuccess) onSuccess()
    }
  }, [refetchServiceIds, closeDrawer, onServiceIdRenewed, onSuccess])

  return (
    <form ref={drawerRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <AnimatePresence>
        {apiError && (
          <MotionAlert 
            variant="destructive" 
            className="mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </MotionAlert>
        )}
      </AnimatePresence>
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">Service ID Details</h3>
        </div>

        <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border mb-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Current Service ID</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="font-mono text-sm">{serviceId.svcid}</p>
                <CopyButton value={serviceId.svcid || ''} tooltipMessage="Copy service ID" />
              </div>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Environment</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm capitalize">{serviceId.env || 'N/A'}</p>
                {serviceId.env && (
                  <CopyButton value={serviceId.env} tooltipMessage="Copy environment" />
                )}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Application</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm">{serviceId.application || 'N/A'}</p>
                {serviceId.application && (
                  <CopyButton value={serviceId.application} tooltipMessage="Copy application" />
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Current Expiry Date</span>
              <p className="text-sm">{expiryDateDisplay}</p>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <p className="text-sm">{serviceId.status || 'N/A'}</p>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Renewal Process</span>
              <p className="text-sm">{serviceId.renewalProcess || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate">New Expiry Date</Label>
            <DatePicker
              value={expiryDate}
              onChange={handleDateChange}
            />
          </div>

          <Collapsible open={showMoreOptions} onOpenChange={setShowMoreOptions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between" type="button">
                Additional Options
                {showMoreOptions ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="changeNumber">Change Number</Label>
                <Input
                  id="changeNumber"
                  placeholder="Enter change number"
                  {...register('changeNumber')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comment">Comment</Label>
                <Input
                  id="comment"
                  placeholder="Add a comment"
                  {...register('comment')}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button 
            type="submit" 
            className="w-full mt-6" 
            disabled={isRenewing}
          >
            {isRenewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {withPlanning ? 'Adding to Planning...' : 'Renewing Service ID...'}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {withPlanning ? 'Add to Planning' : 'Renew Service ID'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
      
      <DrawerClose />
    </form>
  )
}