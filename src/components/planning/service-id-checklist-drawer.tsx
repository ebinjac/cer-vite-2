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
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  UserIcon, 
  FileTerminalIcon,
  RotateCwIcon,
  CheckSquare
} from 'lucide-react'

import type { 
  PlanServiceId, 
  ServiceIdChecklist
} from '@/hooks/use-plan-service-ids'
import { getServiceIdStatus } from '@/hooks/use-plan-service-ids'

type ServiceIdChecklistDrawerProps = {
  serviceId: PlanServiceId
  checklist: ServiceIdChecklist
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: number, updates: Partial<ServiceIdChecklist>, comment: string) => Promise<boolean>
}

// Define checklist items with categories
const checklistItems = [
  {
    key: 'validateExpiry',
    label: 'Validate Service ID expiration date',
    category: 'Preparation'
  },
  {
    key: 'raiseIIQRequest',
    label: 'Raise renewal request in IIQ portal',
    category: 'Preparation'
  },
  {
    key: 'createChangeRequest',
    label: 'Create change request for service ID renewal',
    category: 'Preparation'
  },
  {
    key: 'scheduleDowntime',
    label: 'Schedule downtime for credential rotation',
    category: 'Preparation'
  },
  {
    key: 'notifyStakeholders',
    label: 'Notify stakeholders about upcoming renewal',
    category: 'Preparation'
  },
  {
    key: 'backupConfigurations',
    label: 'Backup application configurations',
    category: 'Implementation'
  },
  {
    key: 'updateCredentials',
    label: 'Update service ID credentials',
    category: 'Implementation'
  },
  {
    key: 'updateApplicationConfig',
    label: 'Update application configuration files',
    category: 'Implementation'
  },
  {
    key: 'updateDependentSystems',
    label: 'Update credentials in dependent systems',
    category: 'Implementation'
  },
  {
    key: 'testConnectivity',
    label: 'Test connectivity with new credentials',
    category: 'Validation'
  },
  {
    key: 'verifyIntegration',
    label: 'Verify integrations with other systems',
    category: 'Validation'
  },
  {
    key: 'performHealthCheck',
    label: 'Perform health check on all services',
    category: 'Validation'
  },
  {
    key: 'documentChanges',
    label: 'Document the changes in service record',
    category: 'Finalization'
  },
  {
    key: 'closureValidation',
    label: 'Validate and close change request',
    category: 'Finalization'
  }
]

export function ServiceIdChecklistDrawer({
  serviceId,
  checklist,
  open,
  onOpenChange,
  onSave
}: ServiceIdChecklistDrawerProps) {
  const [localChecklist, setLocalChecklist] = useState<ServiceIdChecklist>({...checklist})
  const [comment, setComment] = useState(serviceId.comment || '')
  const [isSaving, setIsSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [progress, setProgress] = useState(0)
  
  // Calculate progress whenever checklist changes
  useEffect(() => {
    const totalItems = Object.keys(localChecklist).length
    const checkedItems = Object.values(localChecklist).filter(Boolean).length
    setProgress((checkedItems / totalItems) * 100)
  }, [localChecklist])
  
  const handleCheckboxChange = (key: keyof ServiceIdChecklist) => {
    setLocalChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }
  
  const handleCheckAll = () => {
    const allChecked = Object.values(localChecklist).every(Boolean)
    
    // If all are checked, uncheck all; otherwise check all
    const newValue = !allChecked
    
    const updatedChecklist = {} as ServiceIdChecklist
    Object.keys(localChecklist).forEach(key => {
      updatedChecklist[key as keyof ServiceIdChecklist] = newValue
    })
    
    setLocalChecklist(updatedChecklist)
  }
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await onSave(serviceId.id, localChecklist, comment)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }
  
  const status = getServiceIdStatus(localChecklist)
  
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
            <FileTerminalIcon className="h-5 w-5" />
            Service ID Checklist
          </SheetTitle>
          <SheetDescription>
            Track the progress of service ID renewal tasks
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
              <TabsTrigger value="details">Service ID Details</TabsTrigger>
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
                          localChecklist[item.key as keyof ServiceIdChecklist] 
                            ? 'bg-green-50' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <Checkbox 
                            id={`checkbox-${item.key}`} 
                            checked={localChecklist[item.key as keyof ServiceIdChecklist]} 
                            onCheckedChange={() => handleCheckboxChange(item.key as keyof ServiceIdChecklist)}
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
                  <CardTitle className="text-base">Service ID Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Service ID:</div>
                    <div className="break-all">{serviceId.scid}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Change Number:</div>
                    <div className="font-mono text-xs">{serviceId.changeNumber}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Renewal Date:</div>
                    <div>{new Date(serviceId.renewalDate).toLocaleDateString()}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Expiration Date:</div>
                    <div>{new Date(serviceId.expDate).toLocaleDateString()}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Renewed By:</div>
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>{serviceId.renewedBy}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Team:</div>
                    <div>{serviceId.renewingTeamName}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Status:</div>
                    <div>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${serviceId.currentStatus === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          ${serviceId.currentStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                          ${serviceId.currentStatus === 'continue' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        `}
                      >
                        {serviceId.currentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                    <div className="font-medium">Under Renewal:</div>
                    <div>{serviceId.underRenewal ? 'Yes' : 'No'}</div>
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