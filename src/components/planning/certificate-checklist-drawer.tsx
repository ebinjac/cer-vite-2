'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CalendarIcon, 
  UserIcon, 
  FileTextIcon, 
  KeyIcon,
  ServerIcon,
  ShieldIcon,
  AlertTriangleIcon,
  RotateCwIcon,
  RefreshCcwIcon,
  CheckSquare
} from 'lucide-react'

import type { 
  PlanCertificate, 
  CertificateChecklist
} from '@/hooks/use-plan-certificates'
import { getCertificateStatus } from '@/hooks/use-plan-certificates'

type CertificateChecklistDrawerProps = {
  certificate: PlanCertificate
  checklist: CertificateChecklist
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: number, updates: Partial<CertificateChecklist>, comment: string) => Promise<boolean>
}

// Define checklist items with categories only (icons removed)
const checklistItems = [
  {
    key: 'validateExpiry',
    label: 'Validate the expiry of Common Name',
    category: 'Validation'
  },
  {
    key: 'raiseTapRequest',
    label: 'Raise Tap Request to TIMS',
    category: 'Preparation'
  },
  {
    key: 'downloadCertificates',
    label: 'Download Certificates',
    category: 'Preparation'
  },
  {
    key: 'updateKeystore',
    label: 'Update Keystore (Server Certificates)',
    category: 'Implementation'
  },
  {
    key: 'updateTruststore',
    label: '2 way SSL - Update Truststore',
    category: 'Implementation'
  },
  {
    key: 'installCertificates',
    label: 'Install Certificates',
    category: 'Implementation'
  },
  {
    key: 'restartServer',
    label: 'Restart Server',
    category: 'Implementation'
  },
  {
    key: 'validateChain',
    label: 'Validate the chain of certificate - Leaf, Inter and Root',
    category: 'Validation'
  },
  {
    key: 'checkExpiryDate',
    label: 'Checked whether Expiry date is changed',
    category: 'Validation'
  },
  {
    key: 'checkNewCert',
    label: 'Checked if New Cert is reflecting',
    category: 'Validation'
  },
  {
    key: 'functionalValidations',
    label: 'Functional validations - Ensure system and workflows are not altered or broken',
    category: 'Validation'
  },
  {
    key: 'updateCerser',
    label: 'Update Cerser with new details',
    category: 'Finalization'
  },
]

export function CertificateChecklistDrawer({
  certificate,
  checklist,
  open,
  onOpenChange,
  onSave
}: CertificateChecklistDrawerProps) {
  const [localChecklist, setLocalChecklist] = useState<CertificateChecklist>({...checklist})
  const [comment, setComment] = useState(certificate.comment || '')
  const [isSaving, setIsSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [progress, setProgress] = useState(0)
  
  // Calculate progress whenever checklist changes
  useEffect(() => {
    const totalItems = Object.keys(localChecklist).length
    const checkedItems = Object.values(localChecklist).filter(Boolean).length
    setProgress((checkedItems / totalItems) * 100)
  }, [localChecklist])
  
  const handleCheckboxChange = (key: keyof CertificateChecklist) => {
    setLocalChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }
  
  const handleCheckAll = () => {
    const allChecked = Object.values(localChecklist).every(Boolean)
    
    // If all are checked, uncheck all; otherwise check all
    const newValue = !allChecked
    
    const updatedChecklist = {} as CertificateChecklist
    Object.keys(localChecklist).forEach(key => {
      updatedChecklist[key as keyof CertificateChecklist] = newValue
    })
    
    setLocalChecklist(updatedChecklist)
  }
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await onSave(certificate.id, localChecklist, comment)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }
  
  const status = getCertificateStatus(localChecklist)
  
  // Group checklist items by category
  const categories = ['All', 'Preparation', 'Implementation', 'Validation', 'Finalization']
  const filteredItems = activeCategory === 'All' 
    ? checklistItems 
    : checklistItems.filter(item => item.category === activeCategory)
  
  // Check if all items are checked
  const allChecked = Object.values(localChecklist).every(Boolean)
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto min-w-[900px] p-4" side="right">
        <SheetHeader className="pb-4 space-y-2">
          <SheetTitle className="text-xl flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Certificate Checklist
          </SheetTitle>
          <SheetDescription>
            Track the progress of certificate renewal tasks
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {status === 'pending' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                {status === 'continue' && <Clock className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">Completion Status: {status}</span>
              </div>
              <Badge variant={status === 'completed' ? 'default' : 'outline'} className="capitalize">
                {status}
              </Badge>
            </div>
            <Progress 
              value={progress} 
              className={status === 'completed' ? 'bg-green-100' : status === 'pending' ? 'bg-amber-100' : 'bg-amber-100'} 
            />
          </div>

          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="details">Certificate Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="checklist" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map(category => (
                    <Badge 
                      key={category}
                      variant={activeCategory === category ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1.5"
                  onClick={handleCheckAll}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {allChecked ? 'Uncheck All' : 'Check All'}
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden bg-card">
                <AnimatePresence mode="sync">
                  <div className="max-h-[350px] overflow-y-auto divide-y">
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.03 }}
                        className={`p-2.5 transition-colors ${
                          localChecklist[item.key as keyof CertificateChecklist] 
                            ? 'bg-green-50' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <Checkbox 
                            id={`checkbox-${item.key}`} 
                            checked={localChecklist[item.key as keyof CertificateChecklist]} 
                            onCheckedChange={() => handleCheckboxChange(item.key as keyof CertificateChecklist)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label 
                              htmlFor={`checkbox-${item.key}`} 
                              className="text-sm font-medium leading-tight cursor-pointer"
                            >
                              {item.label}
                            </label>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </div>
              
              <div className="space-y-2 mt-4">
                <label htmlFor="comment" className="text-sm font-medium">
                  Comments
                </label>
                <Textarea
                  id="comment"
                  placeholder="Add your comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Certificate Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Common Name:</div>
                    <div className="break-all">{certificate.commonName}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Serial Number:</div>
                    <div className="font-mono text-xs break-all">{certificate.seriatNumber}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Change Number:</div>
                    <div className="font-mono text-xs">{certificate.changeNumber}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Validity:</div>
                    <div>
                      {certificate.validFrom && (
                        <span>From: {new Date(certificate.validFrom).toLocaleDateString()}</span>
                      )}
                      {certificate.validFrom && certificate.validTo && <span> - </span>}
                      {certificate.validTo && (
                        <span>To: {new Date(certificate.validTo).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Renewal Date:</div>
                    <div>{new Date(certificate.renewalDate).toLocaleDateString()}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Renewed By:</div>
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>{certificate.renewedBy}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Team:</div>
                    <div>{certificate.renewingTeamName}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Status:</div>
                    <div>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${certificate.currentStatus === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          ${certificate.currentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                          ${certificate.currentStatus === 'continue' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        `}
                      >
                        {certificate.currentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <SheetFooter className="mt-4 flex flex-row gap-2 sm:justify-between">
          <SheetClose asChild>
            <Button variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RotateCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 