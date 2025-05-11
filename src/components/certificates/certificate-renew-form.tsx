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
import { InfoIcon, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { CERTIFICATE_RENEW_API, CERTIFICATE_SEARCH_API } from '@/lib/api-endpoints'
import DatePicker from '@/components/ui/DatePicker'
import { format, isAfter, isBefore } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'

// Define form value types
interface RenewalFormValues {
  serialNumber: string
  changeNumber?: string
  expiryDate?: Date
  selectedCertificateId?: string
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

export function CertificateRenewForm({
  certificate,
  withPlanning,
  onSuccess,
  onCertificateRenewed,
}: CertificateRenewFormProps) {
  const [apiError, setApiError] = React.useState<string | null>(null)
  const isAmexCert = certificate?.isAmexCert === 'Yes'
  const isNonAmexCert = certificate?.isAmexCert === 'No'
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<CertSearchResult[]>([])
  const [hasSearched, setHasSearched] = React.useState(false)
  const [manualSerialEntry, setManualSerialEntry] = React.useState(false)
  
  // Set default expiry date to 1 year from now
  const defaultExpiryDate = React.useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }, []);
  
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
      expiryDate: defaultExpiryDate,
      selectedCertificateId: '',
    },
  })
  
  // Watch form values
  const expiryDate = watch('expiryDate');
  const selectedCertificateId = watch('selectedCertificateId');
  const serialNumber = watch('serialNumber');

  // Clear API error after successful submit
  React.useEffect(() => {
    if (isSubmitSuccessful) setApiError(null)
  }, [isSubmitSuccessful])

  // Helper to clear error on any field change
  function handleFieldChange() {
    if (apiError) setApiError(null)
  }

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
      
      // Select the first valid certificate by default if available
      const availableCerts = sortedResults.filter(cert => 
        cert.certificateStatus === 'Issued' && 
        cert.serialNumber !== certificate.serialNumber &&
        !isCertificateExpired(cert.validTo)
      )
      
      if (availableCerts.length > 0) {
        setValue('selectedCertificateId', availableCerts[0].certificateIdentifier)
        setValue('serialNumber', availableCerts[0].serialNumber)
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

  // Custom validation function
  const validateForm = (values: RenewalFormValues): boolean => {
    let isValid = true;
    
    // For both Amex and Non-Amex certificates, a serial number is required
    if (!values.serialNumber) {
      isValid = false;
    }
    
    // For Non-Amex certificates only, an expiry date is required
    if (isNonAmexCert && !values.expiryDate) {
      isValid = false;
    }
    
    // Check for required change number in planning mode
    if (withPlanning && !values.changeNumber) {
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle selecting a certificate from search results
  const handleCertificateSelect = (cert: CertSearchResult) => {
    setValue('selectedCertificateId', cert.certificateIdentifier)
    setValue('serialNumber', cert.serialNumber)
    handleFieldChange()
  }

  // Toggle between manual and automatic serial number entry
  const toggleManualSerialEntry = () => {
    setManualSerialEntry(prev => {
      // If switching to manual, clear the selected certificate
      if (!prev) {
        setValue('selectedCertificateId', '')
      }
      return !prev
    })
  }

  const onSubmit: SubmitHandler<RenewalFormValues> = async (values) => {
    if (!certificate?.certificateIdentifier) {
      setApiError('Certificate identifier is missing')
      return
    }
    
    // Additional validation beyond the form
    if (!validateForm(values)) {
      setApiError('Please fill in all required fields')
      return
    }
    
    try {
      // Prepare payload
      const payload = {
        certificateIdentifier: certificate.certificateIdentifier,
        serialNumber: values.serialNumber,
        changeNumber: withPlanning ? values.changeNumber : '',
        withPlanning,
        commonName: certificate.commonName,
        oldSerialNumber: certificate.serialNumber,
        expiryDate: isNonAmexCert && values.expiryDate 
          ? format(values.expiryDate, 'yyyy-MM-dd') 
          : undefined,
        isAmexCert: certificate.isAmexCert,
        selectedCertificateId: isAmexCert && !manualSerialEntry ? values.selectedCertificateId : undefined
      }
      
      // In a real application, we would call the API
      // This is set up but commented out for now since the endpoint might not exist yet
      /*
      const res = await fetch(CERTIFICATE_RENEW_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        let errorText = ''
        try {
          errorText = await res.text()
        } catch {}
        throw new Error(errorText || `Failed to renew certificate: ${res.status} ${res.statusText}`)
      }
      */
      
      // Simulate API call for demo purposes
      console.log('Certificate renewal payload:', payload)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Certificate renewed successfully!', { 
        description: `The certificate has been renewed with the new serial number ${values.serialNumber}.` 
      })
      
      if (onSuccess) onSuccess()
      if (onCertificateRenewed) onCertificateRenewed()
    } catch (err: any) {
      let message = 'An error occurred while renewing the certificate.'
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.'
      } else if (err?.message) {
        message = err.message
      }
      setApiError(message)
    }
  }

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
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <AnimatePresence>
        {apiError && (
          <MotionAlert 
            variant="destructive" 
            className="mb-4"
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
        className="mb-2"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h3 className="text-base font-medium mb-2">
          {withPlanning ? 'Renew with Planning' : 'Renew without Planning'}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {withPlanning 
            ? 'Renew the certificate with a planned change number' 
            : 'Quickly renew the certificate without a change number'}
        </p>

        <MotionAlert 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Certificate Information</AlertTitle>
          <AlertDescription className="mt-2">
            <motion.div 
              className="space-y-2 text-sm"
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="grid grid-cols-2 gap-1" variants={itemVariants}>
                <span className="font-medium">Certificate:</span>
                <span className="font-semibold">{certificate.commonName}</span>
              </motion.div>
              
              <motion.div className="grid grid-cols-2 gap-1" variants={itemVariants}>
                <span className="font-medium">Current Serial #:</span>
                <span className="font-mono text-xs">{certificate.serialNumber}</span>
              </motion.div>
              
              <motion.div className="grid grid-cols-2 gap-1" variants={itemVariants}>
                <span className="font-medium">Type:</span>
                <span>{certificate.certType || 'N/A'}</span>
              </motion.div>
              
              <motion.div className="grid grid-cols-2 gap-1" variants={itemVariants}>
                <span className="font-medium">Amex Certificate:</span>
                <span>{certificate.isAmexCert}</span>
              </motion.div>
              
              <motion.div className="grid grid-cols-2 gap-1" variants={itemVariants}>
                <span className="font-medium">Current Expiry:</span>
                <span>{expiryDateDisplay}</span>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              The certificate will be renewed with the new details you provide below.
            </motion.div>
          </AlertDescription>
        </MotionAlert>
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Available Certificates</h4>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    manualSerialEntry 
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  onClick={toggleManualSerialEntry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {manualSerialEntry ? "Select Certificate" : "Enter Manually"}
                </motion.button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={searchCertificates}
                    disabled={isSearching}
                    className="h-8"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
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
                      <MotionRadioGroup
                        value={selectedCertificateId}
                        onValueChange={(value) => {
                          const cert = searchResults.find(c => c.certificateIdentifier === value);
                          if (cert) {
                            setValue('selectedCertificateId', value);
                            setValue('serialNumber', cert.serialNumber);
                          }
                        }}
                        className="space-y-2"
                        variants={staggerChildren}
                        initial="hidden"
                        animate="visible"
                      >
                        {searchResults.map((cert) => {
                          const isCurrentCert = cert.serialNumber === certificate.serialNumber;
                          const isSelectable = canSelectCertificate(cert);
                          const isExpired = isCertificateExpired(cert.validTo);
                          const isRevoked = cert.certificateStatus === 'Revoked';
                          
                          // Format dates for display
                          const validToDate = new Date(cert.validTo).toLocaleDateString();
                          
                          return (
                            <motion.div
                              key={cert.certificateIdentifier}
                              className={cn(
                                "relative flex items-start border rounded-md p-3",
                                !isSelectable && "bg-gray-50 border-gray-200",
                                isSelectable && "hover:bg-gray-50/80",
                                selectedCertificateId === cert.certificateIdentifier 
                                  ? "ring-2 ring-primary border-primary bg-primary/5" 
                                  : "border-gray-200"
                              )}
                              variants={itemVariants}
                              whileHover={isSelectable ? "hover" : undefined}
                              animate={selectedCertificateId === cert.certificateIdentifier ? "selected" : "visible"}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center h-5 mt-1">
                                <RadioGroupItem
                                  value={cert.certificateIdentifier}
                                  id={cert.certificateIdentifier}
                                  disabled={!isSelectable}
                                  className={selectedCertificateId === cert.certificateIdentifier ? "text-primary border-primary" : ""}
                                />
                              </div>
                              <div className={cn(
                                "ml-3 w-full",
                                selectedCertificateId === cert.certificateIdentifier && "relative"
                              )}>
                                {selectedCertificateId === cert.certificateIdentifier && (
                                  <div className="absolute -right-2 -top-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                                    Selected
                                  </div>
                                )}
                                <Label
                                  htmlFor={cert.certificateIdentifier}
                                  className={cn(
                                    "font-medium block", 
                                    !isSelectable ? "text-gray-500" : "cursor-pointer",
                                    selectedCertificateId === cert.certificateIdentifier && "text-primary"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={cn(
                                      "font-mono text-xs",
                                      selectedCertificateId === cert.certificateIdentifier && "font-bold text-primary"
                                    )}>
                                      {cert.serialNumber}
                                    </span>
                                    <div className="flex gap-1">
                                      {cert.currentCert && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                                          Active
                                        </Badge>
                                      )}
                                      {isCurrentCert && (
                                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                          Current
                                        </Badge>
                                      )}
                                      {isRevoked && (
                                        <Badge variant="outline" className="bg-red-50 text-red-700">
                                          Revoked
                                        </Badge>
                                      )}
                                      {isExpired && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                          Expired
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </Label>
                                <div className="text-sm text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-xs">Status:</span>
                                    <span className="text-xs font-medium">{cert.certificateStatus}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-xs">Expires:</span>
                                    <span className="text-xs font-medium">{validToDate}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-xs">Env:</span>
                                    <span className="text-xs font-medium">{cert.environment || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-xs">Issuer:</span>
                                    <span className="text-xs font-medium">{cert.issuerCertAuthName}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </MotionRadioGroup>
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
            
            {selectedCertificateId && !manualSerialEntry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium mb-1">Selected Serial Number</label>
                <Input 
                  value={watch('serialNumber')} 
                  disabled
                  className="bg-gray-50 text-gray-600 font-mono text-xs"
                />
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
            
            {isNonAmexCert && (
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-1">(Required for Non-Amex certificates)</span>
                </label>
                <DatePicker
                  value={expiryDate}
                  onChange={handleDateChange}
                  placeholder="Select new expiry date"
                />
                {!expiryDate && isSubmitSuccessful && (
                  <motion.p 
                    className="text-xs text-red-500 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Expiry Date is required for Non-Amex certificates
                  </motion.p>
                )}
              </motion.div>
            )}
          </div>
        )}
        
        {withPlanning && (
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium mb-1">
              Change Number <span className="text-red-500">*</span>
            </label>
            <Input 
              {...register('changeNumber', { 
                required: withPlanning ? 'Change Number is required' : false,
                onChange: handleFieldChange
              })} 
              placeholder="Enter change number" 
            />
            {errors.changeNumber && (
              <motion.p 
                className="text-xs text-red-500 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.changeNumber.message}
              </motion.p>
            )}
          </motion.div>
        )}
      </motion.div>
      
      <motion.div 
        className="flex gap-2 mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renewing...
              </>
            ) : (
              'Renew Certificate'
            )}
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </motion.div>
      </motion.div>
    </form>
  )
} 