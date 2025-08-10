'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DrawerClose } from '@/components/ui/drawer'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Certificate } from '@/hooks/use-certificates'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertCircle, Loader2, RefreshCw, CheckCircle, Calendar, FileText, Settings, Search, Copy, Check } from 'lucide-react'
import { CERTIFICATE_RENEW_API, CERTIFICATE_SEARCH_API } from '@/lib/api-endpoints'
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
import { useCertificates } from '@/hooks/use-certificates'
import { useNavigate } from '@tanstack/react-router'
import { CopyButton } from '@/components/ui/copy-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// Define form value types
interface RenewalFormValues {
  serialNumber: string
  changeNumber?: string
  expiryDate?: Date
  selectedCertificateId?: string
  comment: string
}

interface CertificateRenewFormProps {
  certificate: Certificate | null
  withPlanning: boolean
  onSuccess?: () => void
  onCertificateRenewed?: () => void
}

// Define the structure for certificate search results
interface CertSearchResult {
  certificateIdentifier: string
  certificateStatus: string
  certificatePurpose: string
  currentCert: boolean
  environment: string
  commonName: string
  serialNumber: string
  validFrom: string
  validTo: string
  subjectAlternateNames: string
  issuerCertAuthName: string
  zeroTouch: boolean
  requestId?: string
  hostingTeamName?: string
  idaasIntegrationId?: string
  TaClientName?: string
  applicationId?: string
}

// Define response structure
interface CertSearchResponse {
  body: {
    result: CertSearchResult[]
  }
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
    boxShadow: "0 0 0 2px hsl(var(--primary))",
    backgroundColor: "hsl(var(--primary)/0.05)"
  }
}

// Motion components
const MotionAlert = motion(Alert)
const MotionCard = motion(Card)

// Update RenewalStep interface to include planning specific steps
interface RenewalStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

export function CertificateRenewForm({
  certificate,
  withPlanning,
  onSuccess,
  onCertificateRenewed,
}: CertificateRenewFormProps) {
  const navigate = useNavigate()
  const drawerRef = React.useRef<HTMLFormElement>(null)
  const { refetchCertificates } = useCertificates()
  const [isRenewing, setIsRenewing] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<CertSearchResult[]>([])
  const [selectedCert, setSelectedCert] = React.useState<CertSearchResult | null>(null)
  const [manualSerialEntry, setManualSerialEntry] = React.useState(false)
  const [showMoreOptions, setShowMoreOptions] = React.useState(false)
  const isAmexCert = certificate?.isAmexCert === 'Yes'
  const isNonAmexCert = !isAmexCert
  const [renewalSteps, setRenewalSteps] = React.useState<RenewalStep[]>(() => {
    if (withPlanning) {
      return [
        {
          id: 'initiate',
          title: 'Adding to Planning',
          description: 'Adding certificate to renewal planning',
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
        description: 'Starting the certificate renewal process',
        status: 'pending'
      },
      {
        id: 'complete',
        title: 'Completing Renewal',
        description: 'Finalizing the certificate renewal',
        status: 'pending'
      },
      {
        id: 'refresh',
        title: 'Refreshing Data',
        description: 'Updating certificate information',
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
      toast.success('Certificate added to planning!', { 
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
      if (onCertificateRenewed) {
        onCertificateRenewed()
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
      if (onCertificateRenewed) onCertificateRenewed()
      if (onSuccess) onSuccess()
    }
  }, [navigate, closeDrawer, onCertificateRenewed, onSuccess])

  // Helper function to update step status
  const updateStepStatus = (stepId: string, status: RenewalStep['status']) => {
    setRenewalSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    )
  }

  const onSubmit: SubmitHandler<RenewalFormValues> = async (values) => {
    if (!certificate?.certificateIdentifier) {
      setApiError('Certificate identifier is missing')
      return
    }
    
    if (!validateForm(values)) {
      setApiError(isNonAmexCert 
        ? 'Please provide both serial number and expiry date' 
        : 'Please provide serial number')
      return
    }

    // For non-Amex certs, ensure expiry date is provided
    if (isNonAmexCert && !values.expiryDate) {
      setApiError('Expiry date is required for non-Amex certificates')
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
      
      // Format validTo date for non-Amex certs
      const validTo = isNonAmexCert && values.expiryDate 
        ? format(values.expiryDate, 'yyyy-MM-dd')
        : ""
      
      // Prepare payload for API call
      const payload = {
        serialNumber: values.serialNumber,
        changeNumber: values.changeNumber || '',
        commonName: certificate.commonName,
        expiryDate: validTo,
        checklist: "0,0,0,0,0,0,0,0,0,0,0,0",
        comment: values.comment || "",
        currentStatus: "pending",
        renewalDate: renewalDate,
        renewedBy: "",
        validTo: validTo,
        withPlanning: true // Add flag for planning
      }
      
      console.log('Certificate renewal payload:', payload)
      
      // Send the API request
      const res = await fetch(CERTIFICATE_RENEW_API, {
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
        throw new Error(errorText || `Failed to add certificate to planning: ${res.status} ${res.statusText}`)
      }
      
      // Mark first step as completed
      updateStepStatus('initiate', 'completed')
      
      if (withPlanning) {
        // Handle planning flow success
        await handlePlanningSuccess()
      } else {
        // Handle immediate renewal flow (existing code)
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
      let message = 'An error occurred while processing the certificate.'
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.'
      } else if (err?.message) {
        message = err.message
      }
      setApiError(message)
      toast.error(withPlanning ? 'Failed to add to planning' : 'Certificate renewal failed', {
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
      serialNumber: '',
      changeNumber: '',
      expiryDate: new Date(),
      selectedCertificateId: '',
      comment: 'Renewed the certificate',
    },
  })
  
  // Watch form values
  const expiryDate = watch('expiryDate');
  const serialNumber = watch('serialNumber');
  const comment = watch('comment');

  // Clear API error after successful submit
  React.useEffect(() => {
    if (isSubmitSuccessful) setApiError(null)
  }, [isSubmitSuccessful])

  // Helper to clear error on any field change
  function handleFieldChange() {
    if (apiError) setApiError(null)
  }

  // Select a certificate
  const selectCertificate = (cert: CertSearchResult | null) => {
    setSelectedCert(cert);
    if (cert) {
      setValue('serialNumber', cert.serialNumber);
      setValue('selectedCertificateId', cert.certificateIdentifier);
    } else {
      setValue('serialNumber', '');
      setValue('selectedCertificateId', '');
    }
    handleFieldChange();
  };

  // Function to check if certificate is expired
  const isCertificateExpired = (validTo: string): boolean => {
    try {
      const expiryDate = new Date(validTo);
      const today = new Date();
      return isBefore(expiryDate, today);
    } catch (error) {
      return false;
    }
  }
  
  // Function to search certificates by common name
  const searchCertificates = async () => {
    if (!certificate?.commonName) {
      setApiError('Certificate common name is missing')
      return
    }
    
    setIsSearching(true)
    setApiError(null)
    
    // Clear previous selection when refreshing
    selectCertificate(null);
    
    try {
      const res = await fetch(CERTIFICATE_SEARCH_API(certificate.commonName))
      
      if (!res.ok) {
        throw new Error(`Failed to search certificates: ${res.status} ${res.statusText}`)
      }
      
      const data: CertSearchResponse = await res.json()
      
      // Extract results from the nested structure
      const results = data.body.result || []
      
      // Sort certificates by validTo date (newest first)
      const sortedResults = [...results].sort((a, b) => {
        const dateA = new Date(a.validTo).getTime()
        const dateB = new Date(b.validTo).getTime()
        return dateB - dateA
      })
      
      setSearchResults(sortedResults)
      setHasSearched(true)
      
      // Auto-select the first valid certificate if available
      const availableCerts = sortedResults.filter(cert => 
        cert.certificateStatus !== 'Revoked' && 
        !isCertificateExpired(cert.validTo) &&
        cert.serialNumber !== certificate.serialNumber
      )
      
      if (availableCerts.length > 0) {
        selectCertificate(availableCerts[0]);
      }
      
    } catch (err: any) {
      console.error('Error searching certificates:', err)
      setApiError(err.message || 'Failed to search certificates')
    } finally {
      setIsSearching(false)
    }
  }
  
  // Effect to auto-search certificates for Amex certs on mount
  React.useEffect(() => {
    if (isAmexCert && certificate?.commonName) {
      searchCertificates()
    }
  }, [isAmexCert, certificate?.commonName])

  // Toggle between manual and automatic serial number entry
  const toggleManualSerialEntry = () => {
    setManualSerialEntry(prev => {
      if (prev) {
        // Switching back to certificate selection
        return false;
      } else {
        // Switching to manual entry, clear selected certificate
        selectCertificate(null);
        return true;
      }
    })
  }

  // Custom validation function
  const validateForm = (values: RenewalFormValues): boolean => {
    let isValid = true;
    
    // For all certificates, a serial number is required
    if (!values.serialNumber) {
      isValid = false;
    }
    
    // For Non-Amex certificates, validTo date is required
    if (isNonAmexCert) {
      if (!values.expiryDate) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  if (!certificate) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">No Certificate Selected</h3>
        <p>Please select a certificate to proceed with renewal.</p>
      </div>
    )
  }

  // Calculate expiry date display
  const expiryDateDisplay = certificate.validTo ? new Date(certificate.validTo).toLocaleDateString() : 'N/A';
  
  // Helper function to check if a cert is newer than current
  const isNewerCertificate = (cert: CertSearchResult): boolean => {
    if (!certificate.validTo || !cert.validTo) return false;
    
    try {
      const currentExpiry = new Date(certificate.validTo);
      const certExpiry = new Date(cert.validTo);
      return isAfter(certExpiry, currentExpiry);
    } catch (error) {
      return false;
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setValue('expiryDate', date || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
    handleFieldChange();
  };

  // Check if a cert can be selected (not revoked, not expired, not current cert)
  const canSelectCertificate = (cert: CertSearchResult): boolean => {
    return cert.certificateStatus !== 'Revoked' && 
           !isCertificateExpired(cert.validTo) &&
           cert.serialNumber !== certificate.serialNumber;
  }
  
  // Keep the original handleRenewalSuccess function
  const handleRenewalSuccess = React.useCallback(async (message: string) => {
    try {
      console.log('Handling successful renewal...')
      
      // First refresh the data
      await refetchCertificates()
      console.log('Certificate data refreshed')
      
      // Then show the success toast
      toast.success('Certificate renewed successfully!', { 
        description: message,
        duration: 5000
      })
      console.log('Success toast shown')
      
      // Then close the drawer
      closeDrawer()
      console.log('Drawer closed')
      
      // Finally call the callbacks
      if (onCertificateRenewed) {
        onCertificateRenewed()
      }
      if (onSuccess) {
        onSuccess()
      }
      console.log('Callbacks executed')
    } catch (error) {
      console.error('Error during renewal success handling:', error)
      // Show error toast but don't prevent drawer from closing
      toast.error('Error refreshing certificate data', {
        description: 'The renewal was successful, but there was an error refreshing the data. Please refresh the page.',
        duration: 5000
      })
      // Still close drawer and call callbacks
      closeDrawer()
      if (onCertificateRenewed) onCertificateRenewed()
      if (onSuccess) onSuccess()
    }
  }, [refetchCertificates, closeDrawer, onCertificateRenewed, onSuccess])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Certificate Renewal</h2>
            <p className="text-muted-foreground">
              {withPlanning ? 'Add certificate to renewal planning' : 'Renew certificate immediately'}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "px-3 py-1 text-sm font-medium",
              certificate.isAmexCert === 'Yes' 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-green-50 text-green-700 border-green-200"
            )}
          >
            {certificate.isAmexCert === 'Yes' ? 'Amex Certificate' : 'Non-Amex Certificate'}
          </Badge>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {apiError && (
            <MotionAlert 
              variant="destructive"
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
      </motion.div>

      <form ref={drawerRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Certificate Overview Card */}
        <MotionCard 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.1 }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Certificate Overview</CardTitle>
            </div>
            <CardDescription>
              Current certificate information and renewal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Common Name</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <span className="font-mono text-sm flex-1 truncate">{certificate.commonName}</span>
                  <CopyButton value={certificate.commonName || ''} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Current Serial</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <span className="font-mono text-xs flex-1 truncate">{certificate.serialNumber}</span>
                  <CopyButton value={certificate.serialNumber || ''} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <span className="text-sm">{expiryDateDisplay}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Application</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <span className="text-sm">{certificate.applicationName || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Environment</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <span className="text-sm">{certificate.environment || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Team</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <span className="text-sm">{certificate.hostingTeamName || 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </MotionCard>

        {/* Renewal Configuration */}
        <MotionCard
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.2 }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Renewal Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure the new certificate details for renewal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amex Certificate Selection */}
            {isAmexCert && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Certificate Selection</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose how to provide the new certificate serial number
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={manualSerialEntry ? "outline" : "default"}
                      size="sm"
                      onClick={toggleManualSerialEntry}
                      className="text-xs"
                    >
                      {manualSerialEntry ? "Use Certificate List" : "Enter Manually"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={searchCertificates}
                      disabled={isSearching || manualSerialEntry}
                      className="text-xs"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Searching
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {!manualSerialEntry ? (
                  <div className="space-y-4">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8 bg-muted/30 rounded-lg">
                        <div className="text-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <div>
                            <p className="font-medium">Searching for certificates</p>
                            <p className="text-sm text-muted-foreground">Looking for certificates with common name: {certificate.commonName}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {searchResults.length > 0 ? (
                          <motion.div
                            className="space-y-3"
                            variants={staggerChildren}
                            initial="hidden"
                            animate="visible"
                          >
                            {/* Current Certificate (Reference Only) */}
                            <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/20">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">Current</Badge>
                                    <span className="text-sm font-medium text-muted-foreground">Reference Certificate</span>
                                  </div>
                                  <p className="font-mono text-xs text-muted-foreground">{certificate.serialNumber}</p>
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-1">
                              <Label className="text-sm font-medium">Available Certificates</Label>
                              <p className="text-xs text-muted-foreground">Select a certificate to use for renewal</p>
                            </div>
                            
                            <ScrollArea className="max-h-64">
                              <div className="space-y-2">
                                {searchResults
                                  .filter(cert => 
                                    !isCertificateExpired(cert.validTo) && 
                                    cert.certificateStatus !== 'Revoked' &&
                                    cert.serialNumber !== certificate.serialNumber
                                  )
                                  .map((cert) => {
                                    const isSelected = selectedCert?.serialNumber === cert.serialNumber;
                                    const validToDate = new Date(cert.validTo).toLocaleDateString();
                                    
                                    return (
                                      <motion.div
                                        key={cert.certificateIdentifier}
                                        className={cn(
                                          "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
                                          isSelected 
                                            ? "border-primary bg-primary/5 shadow-sm" 
                                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                                        )}
                                        variants={itemVariants}
                                        whileHover="hover"
                                        animate={isSelected ? "selected" : "visible"}
                                        onClick={() => selectCertificate(isSelected ? null : cert)}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                              <Badge 
                                                variant={isSelected ? "default" : "outline"}
                                                className="text-xs"
                                              >
                                                {isSelected ? "Selected" : "Available"}
                                              </Badge>
                                              {cert.currentCert && (
                                                <Badge variant="secondary" className="text-xs">Active</Badge>
                                              )}
                                            </div>
                                            
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs">{cert.serialNumber}</span>
                                                <CopyButton 
                                                  value={cert.serialNumber} 
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                                <div>
                                                  <span className="font-medium">Status:</span> {cert.certificateStatus}
                                                </div>
                                                <div>
                                                  <span className="font-medium">Expires:</span> {validToDate}
                                                </div>
                                                <div>
                                                  <span className="font-medium">Environment:</span> {cert.environment || 'N/A'}
                                                </div>
                                                <div>
                                                  <span className="font-medium">Issuer:</span> {cert.issuerCertAuthName}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            isSelected 
                                              ? "bg-primary border-primary" 
                                              : "border-muted-foreground/30"
                                          )}>
                                            {isSelected && (
                                              <Check className="w-3 h-3 text-primary-foreground" />
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                              </div>
                            </ScrollArea>
                            
                            {selectedCert && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 border border-primary/20 rounded-lg bg-primary/5"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-primary">Certificate Selected for Renewal</p>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">{selectedCert.serialNumber}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => selectCertificate(null)}
                                    className="text-primary hover:text-primary/80"
                                  >
                                    Clear Selection
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        ) : hasSearched ? (
                          <div className="text-center py-8 bg-muted/30 rounded-lg">
                            <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="font-medium">No certificates found</p>
                            <p className="text-sm text-muted-foreground">No available certificates found for {certificate.commonName}</p>
                          </div>
                        ) : null}
                      </AnimatePresence>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div>
                      <Label htmlFor="manual-serial" className="text-sm font-medium">
                        New Serial Number <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="manual-serial"
                        {...register('serialNumber', { 
                          required: 'New Serial Number is required',
                          onChange: handleFieldChange
                        })} 
                        placeholder="Enter new serial number manually" 
                        className="font-mono text-sm mt-1"
                      />
                      {errors.serialNumber && (
                        <p className="text-xs text-destructive mt-1">{errors.serialNumber.message}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Non-Amex Certificate Fields */}
            {isNonAmexCert && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Current Serial Number</Label>
                    <Input 
                      value={certificate.serialNumber || ''} 
                      disabled
                      className="bg-muted/50 text-muted-foreground font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="new-serial" className="text-sm font-medium">
                      New Serial Number <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="new-serial"
                      {...register('serialNumber', { 
                        required: 'New Serial Number is required',
                        onChange: handleFieldChange
                      })} 
                      placeholder="Enter new serial number" 
                      className="font-mono text-sm"
                    />
                    {errors.serialNumber && (
                      <p className="text-xs text-destructive mt-1">{errors.serialNumber.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    New Expiry Date <span className="text-destructive">*</span>
                  </Label>
                  <div className={cn(!expiryDate && "ring-1 ring-destructive rounded-md")}>
                    <DatePicker
                      value={expiryDate}
                      onChange={handleDateChange}
                      placeholder="Select new expiry date"
                    />
                  </div>
                  {!expiryDate && (
                    <p className="text-xs text-destructive">Expiry Date is required for Non-Amex certificates</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </MotionCard>

        {/* Additional Options */}
        <MotionCard
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3 }}
        >
          <Collapsible 
            open={showMoreOptions}
            onOpenChange={setShowMoreOptions}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Additional Options</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {showMoreOptions ? 'Hide' : 'Show'} Options
                    </Badge>
                    {showMoreOptions ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <CardDescription>
                  Optional fields for tracking and documentation purposes
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="change-number" className="text-sm font-medium">Change Number</Label>
                    <Input 
                      id="change-number"
                      {...register('changeNumber', { onChange: handleFieldChange })} 
                      placeholder="Enter change request number (optional)" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="comment" className="text-sm font-medium">Comment</Label>
                    <Input 
                      id="comment"
                      {...register('comment', { onChange: handleFieldChange })} 
                      placeholder="Add renewal comment (optional)" 
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </MotionCard>

        {/* Action Buttons */}
        <motion.div 
          className="flex items-center justify-between pt-4 border-t"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-sm text-muted-foreground">
            {withPlanning ? 
              "Certificate will be added to the planning queue for review." :
              "Certificate will be renewed immediately."
            }
          </div>
          
          <div className="flex items-center gap-3">
            <DrawerClose asChild data-drawer-close>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSubmitting || isRenewing}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
            </DrawerClose>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || isRenewing} 
              className="min-w-[140px] bg-primary hover:bg-primary/90"
            >
              {isSubmitting || isRenewing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRenewing ? 'Processing...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {withPlanning ? 'Add to Planning' : 'Renew Certificate'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </form>

      {/* Renewal Progress Overlay */}
      {isRenewing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            className="bg-card rounded-xl p-8 shadow-2xl border w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Processing Renewal</h3>
                <p className="text-muted-foreground text-sm">
                  {withPlanning ? 'Adding certificate to planning queue' : 'Renewing certificate'}
                </p>
              </div>
              
              <div className="space-y-4">
                {renewalSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className="flex items-center gap-4 text-left"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="flex-shrink-0">
                      <div 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          step.status === 'completed' && "bg-green-100 text-green-600",
                          step.status === 'in-progress' && "bg-primary/10 text-primary",
                          step.status === 'error' && "bg-destructive/10 text-destructive",
                          step.status === 'pending' && "bg-muted text-muted-foreground"
                        )}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : step.status === 'in-progress' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : step.status === 'error' ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-current opacity-50" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-medium text-sm",
                        step.status === 'completed' && "text-green-600",
                        step.status === 'in-progress' && "text-primary",
                        step.status === 'error' && "text-destructive",
                        step.status === 'pending' && "text-muted-foreground"
                      )}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">Please do not close this window</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
