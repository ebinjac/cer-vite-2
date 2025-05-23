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
import { InfoIcon, AlertCircle, Loader2, RefreshCw, CheckCircle } from 'lucide-react'
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
    return <div className="p-8 text-center text-muted-foreground">No certificate selected for renewal</div>
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
          <h3 className="text-base font-medium">Certificate Details</h3>
          <Badge variant="outline" className={cn(
            "gap-1 items-center",
            certificate.isAmexCert === 'Yes' 
              ? "bg-blue-50 text-blue-700 border-blue-200" 
              : "bg-green-50 text-green-700 border-green-200"
          )}>
            {certificate.isAmexCert === 'Yes' ? 'Amex' : 'Non-Amex'} Certificate
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border mb-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Current Serial #</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="font-mono text-sm">{certificate.serialNumber}</p>
                <CopyButton value={certificate.serialNumber || ''} tooltipMessage="Copy serial number" />
              </div>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Type</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm">{certificate.certType || 'N/A'}</p>
                {certificate.certType && (
                  <CopyButton value={certificate.certType} tooltipMessage="Copy certificate type" />
                )}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Environment</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm capitalize">{certificate.environment || 'N/A'}</p>
                {certificate.environment && (
                  <CopyButton value={certificate.environment} tooltipMessage="Copy environment" />
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Current Expiry</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm">{expiryDateDisplay}</p>
                {certificate.validTo && (
                  <CopyButton value={expiryDateDisplay} tooltipMessage="Copy expiry date" />
                )}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground">Team</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm">{certificate.hostingTeamName || 'N/A'}</p>
                {certificate.hostingTeamName && (
                  <CopyButton value={certificate.hostingTeamName} tooltipMessage="Copy team name" />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ delay: 0.3 }}
      >
        {isAmexCert && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-medium">Renew with Certificate</h4>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  className={cn(
                    "flex items-center text-xs px-3 py-1 rounded-full",
                    manualSerialEntry 
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                  onClick={toggleManualSerialEntry}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {manualSerialEntry ? (
                    <>
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 6l6 6-6 6"/>
                      </svg>
                      Use Certificate List
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 8.517L12 3 7 8.517M7 15.48l5 5.517 5-5.517"/>
                      </svg>
                      Enter Manually
                    </>
                  )}
                </motion.button>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={searchCertificates}
                    disabled={isSearching || manualSerialEntry}
                    className="h-7 px-3 py-1 text-xs flex items-center"
                  >
                    {isSearching ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Refresh
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {!manualSerialEntry ? (
              <>
                {isSearching ? (
                  <motion.div 
                    className="flex justify-center items-center py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-6 w-6 text-primary" />
                    </motion.div>
                    <span className="ml-2 text-sm">Searching for certificates...</span>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {searchResults.length > 0 ? (
                      <motion.div
                        className="space-y-2"
                        variants={staggerChildren}
                        initial="hidden"
                        animate="visible"
                      >
                        {/* Current Certificate Display (For Reference Only) */}
                        <motion.div
                          className="relative flex items-start border-2 border-gray-300 border-dashed rounded-md p-3 bg-gray-50"
                          variants={itemVariants}
                        >
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-700">Current Certificate</div>
                                <div className="font-mono text-xs text-gray-600 mt-1">{certificate.serialNumber}</div>
                              </div>
                              <Badge variant="outline" className="bg-gray-200 text-gray-700">
                                Current
                              </Badge>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              This is the certificate you are currently renewing
                            </div>
                          </div>
                        </motion.div>
                        
                        <div className="text-sm font-medium mt-4 mb-2">Select Certificate for Renewal</div>
                        
                        {/* Calculate valid certificates for display */}
                        {(() => {
                          const validCerts = searchResults.filter(cert => 
                            !isCertificateExpired(cert.validTo) && 
                            cert.certificateStatus !== 'Revoked' &&
                            cert.serialNumber !== certificate.serialNumber
                          );
                          
                          if (validCerts.length === 0) {
                            return (
                              <motion.div 
                                className="text-center py-4 text-sm text-muted-foreground"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                No valid certificates available for renewal. All certificates are either expired, revoked, or the current certificate.
                              </motion.div>
                            );
                          }
                          
                          return null;
                        })()}
                        
                        {/* Available Certificates */}
                        {searchResults.map((cert) => {
                          const isCurrentCert = cert.serialNumber === certificate.serialNumber;
                          const isExpired = isCertificateExpired(cert.validTo);
                          const isRevoked = cert.certificateStatus === 'Revoked';
                          
                          // Skip showing expired, revoked or current certificates
                          if (isCurrentCert || isExpired || isRevoked) return null;
                          
                          const isSelectable = true; // All displayed certificates are now selectable
                          const isSelected = selectedCert?.serialNumber === cert.serialNumber;
                          
                          // Format dates for display
                          const validToDate = new Date(cert.validTo).toLocaleDateString();
                          
                          return (
                            <motion.div
                              key={cert.certificateIdentifier}
                              className={cn(
                                "relative flex items-start border rounded-md p-3 cursor-pointer",
                                isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                              )}
                              variants={itemVariants}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => selectCertificate(isSelected ? null : cert)}
                            >
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className={cn(
                                      "font-medium",
                                      isSelected ? "text-blue-700" : "text-gray-700"
                                    )}>
                                      Certificate {isSelected && "(Selected for Renewal)"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className={cn(
                                        "font-mono text-xs mt-0.5",
                                        isSelected ? "text-blue-600 font-bold" : "text-gray-600"
                                      )}>
                                        {cert.serialNumber}
                                      </div>
                                      <CopyButton 
                                        value={cert.serialNumber} 
                                        tooltipMessage="Copy serial number"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent triggering certificate selection
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    {isSelected && (
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                        Selected
                                      </Badge>
                                    )}
                                    {cert.currentCert && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-sm text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Status:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium">{cert.certificateStatus}</span>
                                      <CopyButton 
                                        value={cert.certificateStatus} 
                                        tooltipMessage="Copy status"
                                        className="h-5 w-5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Expires:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium">{validToDate}</span>
                                      <CopyButton 
                                        value={validToDate} 
                                        tooltipMessage="Copy expiry date"
                                        className="h-5 w-5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Environment:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium">{cert.environment || 'N/A'}</span>
                                      {cert.environment && (
                                        <CopyButton 
                                          value={cert.environment} 
                                          tooltipMessage="Copy environment"
                                          className="h-5 w-5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Issuer:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium">{cert.issuerCertAuthName}</span>
                                      <CopyButton 
                                        value={cert.issuerCertAuthName} 
                                        tooltipMessage="Copy issuer"
                                        className="h-5 w-5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex-shrink-0 ml-2 mt-1",
                                isSelected 
                                  ? "bg-blue-500 border-blue-600 flex items-center justify-center" 
                                  : "border-gray-300"
                              )}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    ) : hasSearched ? (
                      <motion.div 
                        className="text-center py-6 text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        No certificates found for {certificate.commonName}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Serial Number <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    {...register('serialNumber', { 
                      required: 'New Serial Number is required',
                      onChange: handleFieldChange
                    })} 
                    placeholder="Enter new serial number manually" 
                    className="font-mono text-xs"
                  />
                  {errors.serialNumber && (
                    <motion.p 
                      className="text-xs text-red-500 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {errors.serialNumber.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
            
            {selectedCert && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-3 border border-blue-200 rounded-md bg-blue-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-blue-700">Selected for Renewal</h4>
                    <p className="text-xs text-blue-600 font-mono mt-1">{selectedCert.serialNumber}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => selectCertificate(null)}
                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  >
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {!isAmexCert && (
          <div className="grid grid-cols-1 gap-4">
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1">Current Serial Number</label>
              <Input 
                value={certificate.serialNumber || ''} 
                disabled
                className="bg-gray-50 text-gray-600 font-mono text-xs"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1">
                New Serial Number <span className="text-red-500">*</span>
              </label>
              <Input 
                {...register('serialNumber', { 
                  required: 'New Serial Number is required',
                  onChange: handleFieldChange
                })} 
                placeholder="Enter new serial number" 
                className="font-mono text-xs"
              />
              {errors.serialNumber && (
                <motion.p 
                  className="text-xs text-red-500 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.serialNumber.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium mb-1">
                Expiry Date <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-1">(Required for Non-Amex certificates)</span>
              </label>
              <div className={cn(
                !expiryDate && "ring-1 ring-red-500 rounded-md"
              )}>
                <DatePicker
                  value={expiryDate}
                  onChange={handleDateChange}
                  placeholder="Select new expiry date"
                />
              </div>
              {!expiryDate && (
                <motion.p 
                  className="text-xs text-red-500 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Expiry Date is required for Non-Amex certificates
                </motion.p>
              )}
            </motion.div>
          </div>
        )}
        
        <Collapsible 
          open={showMoreOptions}
          onOpenChange={setShowMoreOptions}
          className="mt-4 space-y-4 border rounded-md p-4 pt-2"
        >
          <div className="flex items-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-7 font-medium flex items-center text-primary hover:bg-transparent hover:text-primary hover:underline focus-visible:ring-0 focus-visible:ring-offset-0">
                {showMoreOptions ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                Additional Options
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: showMoreOptions ? 1 : 0,
                height: showMoreOptions ? 'auto' : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium mb-1">
                Change Number
              </label>
              <Input 
                {...register('changeNumber', { 
                  onChange: handleFieldChange
                })} 
                placeholder="Enter change number (optional)" 
              />
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: showMoreOptions ? 1 : 0,
                height: showMoreOptions ? 'auto' : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium mb-1">
                Comment
              </label>
              <Input 
                {...register('comment', { 
                  onChange: handleFieldChange
                })} 
                placeholder="Enter comment about this renewal (optional)" 
              />
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
      
      <motion.div 
        className="flex gap-2 mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: isRenewing ? 1 : 1.05 }}
          whileTap={{ scale: isRenewing ? 1 : 0.95 }}
        >
          <Button 
            type="submit" 
            disabled={isSubmitting || isRenewing} 
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting || isRenewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isRenewing ? 'Renewing Certificate...' : 'Processing...'}
              </>
            ) : (
              'Renew Certificate'
            )}
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: isRenewing ? 1 : 1.05 }}
          whileTap={{ scale: isRenewing ? 1 : 0.95 }}
        >
          <DrawerClose asChild data-drawer-close>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSubmitting || isRenewing}
            >
              Cancel
            </Button>
          </DrawerClose>
        </motion.div>
      </motion.div>
      
      {/* Renewal Progress Overlay */}
      {isRenewing && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <motion.div 
            className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold mb-4">Certificate Renewal in Progress</h3>
            <div className="space-y-4">
              {renewalSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex items-center justify-center">
                      <div 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          step.status === 'completed' && "bg-green-100",
                          step.status === 'in-progress' && "bg-blue-100",
                          step.status === 'error' && "bg-red-100",
                          step.status === 'pending' && "bg-gray-100"
                        )}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : step.status === 'in-progress' ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : step.status === 'error' ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-300" />
                        )}
                      </div>
                      {index < renewalSteps.length - 1 && (
                        <div 
                          className={cn(
                            "absolute top-8 left-1/2 w-0.5 h-8 -translate-x-1/2",
                            step.status === 'completed' ? "bg-green-200" : "bg-gray-200"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className={cn(
                        "text-sm font-medium",
                        step.status === 'completed' && "text-green-600",
                        step.status === 'in-progress' && "text-blue-600",
                        step.status === 'error' && "text-red-600",
                        step.status === 'pending' && "text-gray-600"
                      )}>
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">Please do not close this window</p>
          </motion.div>
        </div>
      )}
    </form>
  )
} 