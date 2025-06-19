"use client"

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { formatDate, getServiceIdCustomStatus, getDaysUntilExpiration } from "@/hooks/use-serviceids"
import { cn } from "@/lib/utils"
import type { ServiceId } from "@/hooks/use-serviceids"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CopyIcon, XIcon, CheckIcon, Settings, Calendar, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"

interface ServiceIdDetailsModalProps {
  serviceId: ServiceId | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DetailField {
  label: string
  value: string | null | undefined
  copyable?: boolean
}

interface Section {
  title: string
  description: string
  icon: React.ReactElement
  fields: DetailField[]
}

const MotionBadge = motion(Badge)
const MotionCard = motion(Card)

const DetailRow = ({
  label,
  value,
  className,
  copyable = false,
}: {
  label: string
  value: string | null | undefined
  className?: string
  copyable?: boolean
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
        <span className="text-sm break-all">{value}</span>
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

const getStatusStyles = (status: string) => {
  switch (status) {
    case "Valid":
      return "bg-green-100 text-green-800 border-green-200"
    case "Non-Compliant":
      return "bg-red-100 text-red-800 border-red-200"
    case "Expiring Soon":
      return "bg-amber-100 text-amber-800 border-amber-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ServiceIdDetailsModal({ serviceId, open, onOpenChange }: ServiceIdDetailsModalProps) {
  if (!serviceId) return null

  const sections: Section[] = [
    {
      title: "Basic Information",
      description: "Core service ID details and configuration",
      icon: <Settings className="h-4 w-4" />,
      fields: [
        { label: "Service ID", value: serviceId.svcid, copyable: true },
        { label: "Environment", value: serviceId.env },
        { label: "Application", value: serviceId.application },
        { label: "Renewal Process", value: serviceId.renewalProcess },
        { label: "Status", value: serviceId.status },
      ],
    },
    {
      title: "Expiry Information",
      description: "Expiration and reset details",
      icon: <Calendar className="h-4 w-4" />,
      fields: [
        { label: "Last Reset", value: formatDate(serviceId.lastReset) },
        { label: "Expiry Date", value: formatDate(serviceId.expDate) },
        { label: "Last Notification", value: serviceId.lastNotification },
        { label: "Last Notification On", value: formatDate(serviceId.lastNotificationOn) },
      ],
    },
    {
      title: "Management Information",
      description: "Team and administrative details",
      icon: <Settings className="h-4 w-4" />,
      fields: [
        { label: "Renewing Team", value: serviceId.renewingTeamName },
        { label: "Acknowledged By", value: serviceId.acknowledgedBy },
        { label: "App Custodian", value: serviceId.appCustodian },
        { label: "Service ID Owner", value: serviceId.svcidOwner },
        { label: "App AIM ID", value: serviceId.appAimId, copyable: true },
        { label: "Change Number", value: serviceId.changeNumber, copyable: true },
      ],
    },
    {
      title: "Additional Information",
      description: "Description and comments",
      icon: <MessageSquare className="h-4 w-4" />,
      fields: [
        { label: "Description", value: serviceId.description },
        { label: "Comment", value: serviceId.comment },
      ],
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

  const customStatus = getServiceIdCustomStatus(serviceId.expDate)
  const daysLeft = getDaysUntilExpiration(serviceId.expDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[90vh] p-0 flex flex-col overflow-y-auto DialogContent">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {serviceId.svcid}
                </DialogTitle>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onOpenChange(false)}>
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <MotionBadge
                  variant="outline"
                  className={cn("px-3 py-1 text-xs font-medium", getStatusStyles(customStatus))}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.2 }}
                >
                  {customStatus}
                </MotionBadge>
                {serviceId.expDate && (
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground">
                      Expires: <span className="font-medium text-foreground">{formatDate(serviceId.expDate)}</span>
                    </div>
                    {daysLeft !== null && (
                      <motion.div 
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-medium",
                          daysLeft <= 30 ? "text-amber-600" : "text-green-600",
                          daysLeft === 0 && "text-destructive"
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {daysLeft === 0 ? (
                          "Non-Compliant"
                        ) : (
                          <>
                            <span className="font-bold">{daysLeft}</span>
                            days left
                            {daysLeft <= 30 && (
                              <motion.div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  daysLeft <= 7 ? "bg-destructive" : "bg-amber-500"
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </CardTitle>
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
                        className={cn(
                          field.label === "Comment" && "items-start",
                          field.label === "Description" && "items-start",
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