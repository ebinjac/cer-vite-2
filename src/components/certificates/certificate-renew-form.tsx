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
import { format, isAfter } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

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

  // Clear API error after successful submit
  React.useEffect(() => {
    if (isSubmitSuccessful) setApiError(null)
  }, [isSubmitSuccessful])

  // Helper to clear error on any field change
  function handleFieldChange() {
    if (apiError) setApiError(null)
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
      
      const data: CertSearchResult[] = await res.json()
      
      // Sort certificates by validTo date (newest first)
      const sortedResults = [...data].sort((a, b) => {
        const dateA = new Date(a.validTo).getTime()
        const dateB = new Date(b.validTo).getTime()
        return dateB - dateA
      })
      
      setSearchResults(sortedResults)
      setHasSearched(true)
      
      // Select the first valid certificate by default if available
      const availableCerts = sortedResults.filter(cert => 
        cert.certificateStatus === 'Issued' && 
        cert.serialNumber !== certificate.serialNumber
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
    
    if (isAmexCert) {
      // For Amex certificates, we need a selected certificate
      if (!values.selectedCertificateId) {
        isValid = false;
      }
    } else {
      // For Non-Amex certificates
      // Check for required serial number
      if (!values.serialNumber) {
        isValid = false;
      }
      
      // Check for required expiry date
      if (!values.expiryDate) {
        isValid = false;
      }
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
        selectedCertificateId: isAmexCert ? values.selectedCertificateId : undefined
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
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-2">
        <h3 className="text-base font-medium mb-2">
          {withPlanning ? 'Renew with Planning' : 'Renew without Planning'}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {withPlanning 
            ? 'Renew the certificate with a planned change number' 
            : 'Quickly renew the certificate without a change number'}
        </p>

        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Certificate Information</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Certificate:</span>
                <span className="font-semibold">{certificate.commonName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Current Serial #:</span>
                <span className="font-mono text-xs">{certificate.serialNumber}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Type:</span>
                <span>{certificate.certType || 'N/A'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Amex Certificate:</span>
                <span>{certificate.isAmexCert}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Current Expiry:</span>
                <span>{expiryDateDisplay}</span>
              </div>
            </div>
            
            <div className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">
              The certificate will be renewed with the new details you provide below.
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-4">
        {isAmexCert ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Available Certificates</h4>
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
            </div>
            
            {isSearching ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm">Searching for certificates...</span>
              </div>
            ) : (
              <div>
                {searchResults.length > 0 ? (
                  <RadioGroup
                    value={selectedCertificateId}
                    onValueChange={(value) => {
                      const cert = searchResults.find(c => c.certificateIdentifier === value);
                      if (cert) {
                        setValue('selectedCertificateId', value);
                        setValue('serialNumber', cert.serialNumber);
                      }
                    }}
                    className="space-y-2"
                  >
                    {searchResults.map((cert) => {
                      const isCurrentCert = cert.serialNumber === certificate.serialNumber;
                      const isNewer = isNewerCertificate(cert);
                      
                      // Format dates for display
                      const validToDate = new Date(cert.validTo).toLocaleDateString();
                      
                      return (
                        <div
                          key={cert.certificateIdentifier}
                          className={cn(
                            "relative flex items-start border rounded-md p-3",
                            isCurrentCert ? "bg-gray-50 border-gray-200" : "hover:bg-gray-50",
                            selectedCertificateId === cert.certificateIdentifier && "ring-2 ring-primary"
                          )}
                        >
                          <div className="flex items-center h-5 mt-1">
                            <RadioGroupItem
                              value={cert.certificateIdentifier}
                              id={cert.certificateIdentifier}
                              disabled={isCurrentCert}
                            />
                          </div>
                          <div className="ml-3 w-full">
                            <Label
                              htmlFor={cert.certificateIdentifier}
                              className={cn("font-medium block", 
                                isCurrentCert ? "text-gray-500" : "cursor-pointer"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs">{cert.serialNumber}</span>
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
                                  {isNewer && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                      Newer
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
                        </div>
                      );
                    })}
                  </RadioGroup>
                ) : hasSearched ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No certificates found for {certificate.commonName}
                  </div>
                ) : null}
              </div>
            )}
            
            {selectedCertificateId && (
              <div>
                <label className="block text-sm font-medium mb-1">Selected Serial Number</label>
                <Input 
                  value={watch('serialNumber')} 
                  disabled
                  className="bg-gray-50 text-gray-600 font-mono text-xs"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Serial Number</label>
              <Input 
                value={certificate.serialNumber || ''} 
                disabled
                className="bg-gray-50 text-gray-600 font-mono text-xs"
              />
            </div>
            
            <div>
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
                <p className="text-xs text-red-500 mt-1">{errors.serialNumber.message}</p>
              )}
            </div>
            
            {isNonAmexCert && (
              <div>
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
                  <p className="text-xs text-red-500 mt-1">Expiry Date is required for Non-Amex certificates</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {withPlanning && (
          <div>
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
              <p className="text-xs text-red-500 mt-1">{errors.changeNumber.message}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-6">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? 'Renewing...' : 'Renew Certificate'}
        </Button>
        <DrawerClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DrawerClose>
      </div>
    </form>
  )
} 