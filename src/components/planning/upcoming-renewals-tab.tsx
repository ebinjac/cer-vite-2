import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ServerCog, AlertTriangle, Clock, CheckCircle2, Search, XCircle, Download } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type RenewalType = 'certificate' | 'service-id'
type SortOrder = 'asc' | 'desc'
type Environment = 'E1' | 'E2' | 'E3'

interface UpcomingRenewal {
  id: string
  name: string
  type: RenewalType
  expirationDate: string
  daysUntilExpiration: number
  status: string
  environment: Environment
  team: string
}

interface UpcomingRenewalsTabProps {
  certificates: UpcomingRenewal[]
  serviceIds: UpcomingRenewal[]
  isLoading: boolean
  isError: boolean
  error?: Error
}

export function UpcomingRenewalsTab({
  certificates,
  serviceIds,
  isLoading,
  isError,
  error
}: UpcomingRenewalsTabProps) {
  const [selectedView, setSelectedView] = React.useState<'all' | RenewalType>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc')
  const [selectedEnvironment, setSelectedEnvironment] = React.useState<Environment | 'all'>('all')

  // Function to get status color and icon
  const getStatusInfo = (days: number) => {
    if (days <= 30) return { color: 'text-destructive', icon: <AlertTriangle className="h-4 w-4" /> }
    if (days <= 60) return { color: 'text-warning', icon: <Clock className="h-4 w-4" /> }
    return { color: 'text-muted-foreground', icon: <CheckCircle2 className="h-4 w-4" /> }
  }

  // Filter and sort items
  const processItems = React.useCallback((items: UpcomingRenewal[]) => {
    return items
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.team.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesEnvironment = selectedEnvironment === 'all' || 
                                 item.environment.toUpperCase() === selectedEnvironment.toUpperCase()
        return matchesSearch && matchesEnvironment
      })
      .sort((a, b) => {
        const comparison = a.daysUntilExpiration - b.daysUntilExpiration
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [searchQuery, selectedEnvironment, sortOrder])

  // Group items by time range
  const groupByTimeRange = React.useCallback((items: UpcomingRenewal[]) => {
    const processedItems = processItems(items)
    return {
      critical: processedItems.filter(item => item.daysUntilExpiration <= 30),
      warning: processedItems.filter(item => item.daysUntilExpiration > 30 && item.daysUntilExpiration <= 60),
      upcoming: processedItems.filter(item => item.daysUntilExpiration > 60 && item.daysUntilExpiration <= 90)
    }
  }, [processItems])

  // Get filtered items based on selected view
  const getFilteredItems = React.useCallback(() => {
    const items = selectedView === 'all'
      ? [...certificates, ...serviceIds]
      : selectedView === 'certificate'
        ? certificates
        : serviceIds
    return groupByTimeRange(items)
  }, [certificates, serviceIds, selectedView, groupByTimeRange])

  // Function to export data to CSV
  const exportToCSV = React.useCallback(() => {
    const items = selectedView === 'all'
      ? [...certificates, ...serviceIds]
      : selectedView === 'certificate'
        ? certificates
        : serviceIds

    const filteredItems = processItems(items)
    
    // CSV Headers
    const headers = ['Type', 'Name', 'Environment', 'Team', 'Status', 'Days Until Expiration', 'Expiration Date']
    
    // Convert items to CSV rows
    const rows = filteredItems.map(item => [
      item.type,
      item.name,
      item.environment,
      item.team,
      item.status,
      item.daysUntilExpiration.toString(),
      new Date(item.expirationDate).toLocaleDateString()
    ])
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `upcoming-renewals-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [certificates, serviceIds, selectedView, processItems])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <Clock className="animate-spin h-5 w-5" />
          <span>Loading upcoming renewals...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error?.message || 'Failed to load upcoming renewals'}
        </AlertDescription>
      </Alert>
    )
  }

  const RenewalItem = ({ item }: { item: UpcomingRenewal }) => {
    const { color, icon } = getStatusInfo(item.daysUntilExpiration)
    
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-full bg-primary/10">
            {item.type === 'certificate' ? (
              <ShieldCheck className="h-5 w-5 text-primary" />
            ) : (
              <ServerCog className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="space-y-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground flex items-center space-x-2">
              <Badge variant="secondary" className="rounded-sm">
                {item.environment}
              </Badge>
              <span>•</span>
              <span>{item.team}</span>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-auto flex items-center gap-1",
                  color
                )}
              >
                {icon}
                <span>{item.daysUntilExpiration} days</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Expires on {new Date(item.expirationDate).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">
                {item.daysUntilExpiration <= 30 ? 'Critical: Immediate action required' :
                 item.daysUntilExpiration <= 60 ? 'Warning: Plan renewal soon' :
                 'Upcoming: Monitor and plan accordingly'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  const TimeSection = ({ title, items }: { title: string, items: UpcomingRenewal[] }) => (
    items.length > 0 ? (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </h3>
        <div className="space-y-3">
          {items.map(item => (
            <RenewalItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    ) : null
  )

  const filteredItems = getFilteredItems()
  const hasItems = Object.values(filteredItems).some(items => items.length > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Certificates and Service IDs expiring in the next 90 days</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
            <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="certificate">Certificates</TabsTrigger>
                <TabsTrigger value="service-id">Service IDs</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedEnvironment} onValueChange={(v) => setSelectedEnvironment(v as Environment | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value="E1">E1</SelectItem>
              <SelectItem value="E2">E2</SelectItem>
              <SelectItem value="E3">E3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by expiration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Earliest First</SelectItem>
              <SelectItem value="desc">Latest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {hasItems ? (
            <div className="space-y-8">
              <TimeSection 
                title="Critical (≤ 30 days)" 
                items={filteredItems.critical}
              />
              <TimeSection 
                title="Warning (31-60 days)" 
                items={filteredItems.warning}
              />
              <TimeSection 
                title="Upcoming (61-90 days)" 
                items={filteredItems.upcoming}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No renewals found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 
                  'Try adjusting your search or filters' : 
                  'No items require renewal in the next 90 days'}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 