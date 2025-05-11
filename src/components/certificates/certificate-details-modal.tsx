"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { formatDate } from "@/hooks/use-certificates"
import { cn } from "@/lib/utils"
import type { Certificate } from "@/hooks/use-certificates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CopyIcon, ExternalLinkIcon, XIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"

interface CertificateDetailsModalProps {
  certificate: Certificate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MotionBadge = motion(Badge)
const MotionCard = motion(Card)

const DetailRow = ({
  label,
  value,
  className,
  copyable = false,
  isLink = false,
}: {
  label: string
  value: string | null | undefined
  className?: string
  copyable?: boolean
  isLink?: boolean
}) => {
  if (!value) return null
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex items-start py-2 border-b border-border/40 last:border-0", className)}>
      <dt className="w-[180px] flex-shrink-0 text-sm font-medium text-muted-foreground pt-1">{label}</dt>
      <dd className="flex-1 flex items-start gap-2">
        {isLink && value.startsWith("http") ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1 transition-colors"
          >
            {value}
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-sm break-all">{value}</span>
        )}
        {copyable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-muted rounded-full transition-colors relative"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
          >
            <AnimatePresence>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-green-600"
                >
                  <CheckIcon className="h-3 w-3" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <CopyIcon className="h-3 w-3" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        )}
      </dd>
    </div>
  )
}

// Add helper function to get custom status based on days left
const getCustomStatus = (daysLeft: number | null) => {
  if (daysLeft === null) return 'Unknown'
  if (daysLeft === 0) return 'Expired'
  if (daysLeft <= 30) return 'Expiring Soon'
  return 'Valid'
}

const getStatusStyles = (status: string | undefined, isCustomStatus = false) => {
  if (isCustomStatus) {
    switch (status) {
      case "Valid":
        return "bg-green-100 text-green-800 border-green-200"
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "Expiring Soon":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Original status styles for Amex certificates
  switch (status) {
    case "Issued":
      return "bg-green-100 text-green-800 border-green-200"
    case "Expired":
      return "bg-red-100 text-red-800 border-red-200"
    case "Pending":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "Revoked":
      return "bg-gray-100 text-gray-800 border-gray-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

// Add a helper function to calculate days left
const getDaysLeft = (validTo: string | undefined) => {
  if (!validTo) return null
  const today = new Date()
  const expiryDate = new Date(validTo)
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export function CertificateDetailsModal({ certificate, open, onOpenChange }: CertificateDetailsModalProps) {
  if (!certificate) return null

  const sections = [
    {
      title: "Basic Information",
      description: "Core certificate details and validity information",
      fields: [
        { label: "Common Name", value: certificate.commonName, copyable: true },
        { label: "Serial Number", value: certificate.serialNumber, copyable: true },
        { label: "Certificate Status", value: certificate.certificateStatus },
        { label: "Valid From", value: formatDate(certificate.validFrom) },
        { label: "Valid To", value: formatDate(certificate.validTo) },
        { label: "Certificate Purpose", value: certificate.certificatePurpose },
        { label: "Current Certificate", value: certificate.currentCert === "true" ? "Yes" : "No" },
        { label: "Environment", value: certificate.environment },
      ],
    },
    {
      title: "Technical Details",
      description: "Technical specifications and identifiers",
      fields: [
        { label: "Certificate Identifier", value: certificate.certificateIdentifier, copyable: true },
        { label: "Subject Alternate Names", value: certificate.subjectAlternateNames, copyable: true },
        { label: "Zero Touch", value: certificate.zeroTouch === "true" ? "Yes" : "No" },
        { label: "Issuer CA Name", value: certificate.issuerCertAuthName },
        { label: "Certificate Type", value: certificate.certType },
        { label: "IDaaS Integration ID", value: certificate.idaasIntegrationId, copyable: true },
        { label: "Is Amex Certificate", value: certificate.isAmexCert },
        { label: "Central ID", value: certificate.centralID, copyable: true },
      ],
    },
    {
      title: "Management Information",
      description: "Team and administrative details",
      fields: [
        { label: "Hosting Team", value: certificate.hostingTeamName },
        { label: "Renewing Team", value: certificate.renewingTeamName },
        { label: "Application Name", value: certificate.applicationName },
        { label: "Acknowledged By", value: certificate.acknowledgedBy },
        { label: "Change Number", value: certificate.changeNumber, copyable: true },
        { label: "Last Notification", value: certificate.lastNotification?.toString() },
        { label: "Last Notification On", value: formatDate(certificate.lastNotificationOn) },
      ],
    },
    {
      title: "Server Information",
      description: "Server and location details",
      fields: [
        { label: "Server Name", value: certificate.serverName },
        { label: "Keystore Path", value: certificate.keystorePath, copyable: true },
        { label: "URI", value: certificate.uri, isLink: true },
      ],
    },
    {
      title: "Additional Information",
      description: "Comments and other details",
      fields: [{ label: "Comments", value: certificate.comment }],
    },
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[90vh] p-0 flex flex-col overflow-y-auto DialogContent">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-xl font-semibold">
                  {certificate.commonName}
                </DialogTitle>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onOpenChange(false)}>
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <div className="flex items-center gap-4">
                {certificate.isAmexCert === 'Yes' ? (
                  <MotionBadge
                    variant="outline"
                    className={cn("px-3 py-1 text-xs font-medium", getStatusStyles(certificate.certificateStatus))}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                  >
                    {certificate.certificateStatus}
                  </MotionBadge>
                ) : (
                  <MotionBadge
                    variant="outline"
                    className={cn(
                      "px-3 py-1 text-xs font-medium",
                      getStatusStyles(getCustomStatus(getDaysLeft(certificate.validTo)), true)
                    )}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                  >
                    {getCustomStatus(getDaysLeft(certificate.validTo))}
                  </MotionBadge>
                )}
                {certificate.validTo && (
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground">
                      Expires: <span className="font-medium text-foreground">{formatDate(certificate.validTo)}</span>
                    </div>
                    {getDaysLeft(certificate.validTo) !== null && (
                      <motion.div 
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-medium",
                          getDaysLeft(certificate.validTo)! <= 30 ? "text-amber-600" : "text-green-600",
                          getDaysLeft(certificate.validTo) === 0 && "text-destructive"
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {getDaysLeft(certificate.validTo) === 0 ? (
                          "Expired"
                        ) : (
                          <>
                            <span className="font-bold">{getDaysLeft(certificate.validTo)}</span>
                            days left
                            {getDaysLeft(certificate.validTo)! <= 30 && (
                              <motion.div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  getDaysLeft(certificate.validTo)! <= 7 ? "bg-destructive" : "bg-amber-500"
                                )}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 300, 
                                  damping: 10,
                                  delay: 0.4
                                }}
                              />
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sections.map((section) => (
              <MotionCard
                key={section.title}
                className={cn(
                  "col-span-1 shadow-sm border-border/60 h-full",
                  section.title === "Additional Information" && "col-span-1 md:col-span-2",
                )}
                variants={cardVariants}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0 divide-y divide-border/40">
                    {section.fields.map((field) => (
                      <DetailRow
                        key={field.label}
                        label={field.label}
                        value={field.value}
                        copyable={field.copyable}
                        isLink={field.isLink}
                        className={cn(
                          field.label === "Comments" && "items-start",
                          field.label === "Subject Alternate Names" && "items-start",
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </MotionCard>
            ))}
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
