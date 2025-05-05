'use client'

import * as React from 'react'
import { X, Plus, Filter, Trash2, Calendar, CheckCircle, XCircle, Clock, Server, Tag, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

// Filter types
export type FilterCriteria = {
  field: string
  operator: string
  value: string | string[]
}

export type AdvancedFilters = {
  expiresIn?: '30' | '60' | '90' | null
  status?: string[]
  environment?: string[]
  purpose?: string[]
  hostname?: string
  issuer?: string
  team?: string
  customFilters: FilterCriteria[]
}

interface CertificateFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: AdvancedFilters) => void
  availableEnvironments: string[]
  availablePurposes: string[]
  availableTeams: string[]
  availableStatuses: string[]
}

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
]

const FIELDS = [
  { value: 'commonName', label: 'Common Name' },
  { value: 'serialNumber', label: 'Serial Number' },
  { value: 'certificateIdentifier', label: 'Certificate ID' },
  { value: 'issuerCertAuthName', label: 'Issuer' },
  { value: 'applicationName', label: 'Application' },
  { value: 'serverName', label: 'Server' },
  { value: 'uri', label: 'URI' },
  { value: 'certType', label: 'Certificate Type' },
]

const statusIcons: Record<string, React.ReactNode> = {
  Issued: <CheckCircle className="h-4 w-4 text-green-500" />,
  Expired: <XCircle className="h-4 w-4 text-destructive" />,
  Pending: <Clock className="h-4 w-4 text-amber-500" />,
  Revoked: <XCircle className="h-4 w-4 text-gray-500" />,
}

export function CertificateFilters({
  isOpen,
  onClose,
  onApplyFilters,
  availableEnvironments,
  availablePurposes,
  availableTeams,
  availableStatuses,
}: CertificateFiltersProps) {
  const [filters, setFilters] = React.useState<AdvancedFilters>({
    customFilters: [],
  })
  const [activeTab, setActiveTab] = React.useState('advanced')

  // Add a custom filter row
  const addCustomFilter = () => {
    setFilters(prev => ({
      ...prev,
      customFilters: [
        ...prev.customFilters,
        { field: 'commonName', operator: 'contains', value: '' }
      ]
    }))
  }

  // Remove a custom filter
  const removeCustomFilter = (index: number) => {
    setFilters(prev => ({
      ...prev,
      customFilters: prev.customFilters.filter((_, i) => i !== index)
    }))
  }

  // Update a custom filter
  const updateCustomFilter = (index: number, field: string, value: string) => {
    setFilters(prev => {
      const newFilters = [...prev.customFilters]
      // Ensure we don't allow empty values for field or operator
      if ((field === 'field' || field === 'operator') && value === '') {
        value = field === 'field' ? 'commonName' : 'contains'
      }
      newFilters[index] = { ...newFilters[index], [field]: value }
      return { ...prev, customFilters: newFilters }
    })
  }

  // Update expiration filter
  const updateExpiresInFilter = (value: '30' | '60' | '90' | null) => {
    setFilters(prev => ({ ...prev, expiresIn: value }))
  }

  // Update status filter
  const toggleStatusFilter = (status: string) => {
    setFilters(prev => {
      const currentStatuses = prev.status || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status]
      
      return { ...prev, status: newStatuses }
    })
  }

  // Update environment filter
  const toggleEnvironmentFilter = (env: string) => {
    setFilters(prev => {
      const currentEnvs = prev.environment || []
      const newEnvs = currentEnvs.includes(env)
        ? currentEnvs.filter(e => e !== env)
        : [...currentEnvs, env]
      
      return { ...prev, environment: newEnvs }
    })
  }

  // Update purpose filter
  const togglePurposeFilter = (purpose: string) => {
    setFilters(prev => {
      const currentPurposes = prev.purpose || []
      const newPurposes = currentPurposes.includes(purpose)
        ? currentPurposes.filter(p => p !== purpose)
        : [...currentPurposes, purpose]
      
      return { ...prev, purpose: newPurposes }
    })
  }

  // Update team filter
  const updateTeamFilter = (team: string) => {
    setFilters(prev => ({ ...prev, team: team === 'all' ? undefined : team }))
  }

  // Update hostname filter
  const updateHostnameFilter = (hostname: string) => {
    setFilters(prev => ({ ...prev, hostname }))
  }

  // Update issuer filter
  const updateIssuerFilter = (issuer: string) => {
    setFilters(prev => ({ ...prev, issuer }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({ customFilters: [] })
  }

  // Apply the filters
  const applyFilters = () => {
    onApplyFilters(filters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-4xl shadow-lg border-border/60 max-h-[80vh] overflow-auto">
        <div className="p-4 flex items-center justify-between border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Filters</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="advanced">Advanced filters</TabsTrigger>
              <TabsTrigger value="command">Command filters</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="advanced" className="px-4 pb-4 pt-2">
            <div className="space-y-6">
              {/* Expiration filters */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={filters.expiresIn === '30' ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateExpiresInFilter(filters.expiresIn === '30' ? null : '30')}
                  >
                    Expires in 30 days
                  </Badge>
                  <Badge 
                    variant={filters.expiresIn === '60' ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateExpiresInFilter(filters.expiresIn === '60' ? null : '60')}
                  >
                    Expires in 60 days
                  </Badge>
                  <Badge 
                    variant={filters.expiresIn === '90' ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateExpiresInFilter(filters.expiresIn === '90' ? null : '90')}
                  >
                    Expires in 90 days
                  </Badge>
                </div>
              </div>
              
              {/* Status filters */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses
                    .filter(status => status && status.trim() !== '')
                    .map(status => (
                      <Badge 
                        key={status}
                        variant={(filters.status || []).includes(status) ? "default" : "outline"}
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => toggleStatusFilter(status)}
                      >
                        {statusIcons[status]} {status}
                      </Badge>
                    ))}
                </div>
              </div>
              
              {/* Environment filters */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Environment
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableEnvironments
                    .filter(env => env && env.trim() !== '')
                    .map(env => (
                      <Badge 
                        key={env}
                        variant={(filters.environment || []).includes(env) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleEnvironmentFilter(env)}
                      >
                        {env}
                      </Badge>
                    ))}
                </div>
              </div>
              
              {/* Purpose filters */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Purpose
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availablePurposes
                    .filter(purpose => purpose && purpose.trim() !== '')
                    .map(purpose => (
                      <Badge 
                        key={purpose}
                        variant={(filters.purpose || []).includes(purpose) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => togglePurposeFilter(purpose)}
                      >
                        {purpose}
                      </Badge>
                    ))}
                </div>
              </div>
              
              {/* Server & Team filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Hostname
                  </h3>
                  <Input 
                    placeholder="Filter by hostname..."
                    value={filters.hostname || ''}
                    onChange={(e) => updateHostnameFilter(e.target.value)}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team
                  </h3>
                  <Select 
                    value={filters.team || 'all'} 
                    onValueChange={updateTeamFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All teams</SelectItem>
                      {availableTeams
                        .filter(team => team && team.trim() !== '')
                        .map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              {/* Custom filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Custom filters</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomFilter}
                    className="h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add filter
                  </Button>
                </div>
                
                {filters.customFilters.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No custom filters added
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filters.customFilters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={filter.field || 'commonName'}
                          onValueChange={(value) => updateCustomFilter(index, 'field', value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELDS.map(field => (
                              <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={filter.operator || 'contains'}
                          onValueChange={(value) => updateCustomFilter(index, 'operator', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                          <Input
                            value={filter.value as string}
                            onChange={(e) => updateCustomFilter(index, 'value', e.target.value)}
                            placeholder="Value"
                            className="flex-1"
                          />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomFilter(index)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="command" className="p-4">
            <div className="space-y-4">
              <div className="text-sm">
                <p>Use command filters to quickly filter certificates using text commands.</p>
                <p className="text-muted-foreground mt-1">Examples:</p>
                <ul className="ml-5 mt-2 space-y-1 list-disc">
                  <li>status:Issued</li>
                  <li>env:Production expiring:30</li>
                  <li>team:"Security Team" cn:*.example.com</li>
                </ul>
              </div>
              
              <Input 
                placeholder="Type filter commands... (e.g., status:Issued env:Production)"
              />
              
              <div className="border rounded-md p-3 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Available commands</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono">status:</span>
                    <span className="text-muted-foreground">Certificate status</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">env:</span>
                    <span className="text-muted-foreground">Environment</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">expiring:</span>
                    <span className="text-muted-foreground">Days until expiration</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">team:</span>
                    <span className="text-muted-foreground">Team name</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">cn:</span>
                    <span className="text-muted-foreground">Common name</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono">purpose:</span>
                    <span className="text-muted-foreground">Certificate purpose</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <CardContent className="border-t p-4 flex items-center justify-between bg-muted/20 sticky bottom-0">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Reset
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={applyFilters}
            >
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 