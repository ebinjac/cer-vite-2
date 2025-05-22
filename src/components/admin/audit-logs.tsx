import * as React from 'react'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, parse, isValid } from "date-fns"
import { RotateCw, AlertCircle, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ParsedAuditLog {
  id: number
  action: string
  details: string
  timestamp: Date | null
  user: string
}

export function AuditLogs() {
  const { data: logs, isLoading, isError, error, refetch } = useAuditLogs()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedAction, setSelectedAction] = React.useState<string>('all')
  const [selectedDate, setSelectedDate] = React.useState<Date>()

  // Add debug logging
  React.useEffect(() => {
    console.log('Audit Logs State:', {
      logs,
      isLoading,
      isError,
      error,
      filteredLogsLength: filteredLogs?.length
    })
  }, [logs, isLoading, isError, error])

  // Function to parse and format the audit record
  const parseAuditRecord = (log: { id: number, cerserAuditRecord: string }): ParsedAuditLog | null => {
    try {
      const [action, ...rest] = log.cerserAuditRecord.split(':')
      const details = rest.join(':').trim()
      
      // Try different regex patterns to extract date and user
      const patterns = [
        // Pattern 1: "... By user DD-MM-YYYY HH:mm:ss"
        /(.*?) By (.*?) (\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2})/,
        // Pattern 2: "... by-user DD-MM-YYYY HH:mm:ss"
        /(.*?) by-(.*?) (\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2})/,
        // Pattern 3: Just extract the date if it exists
        /(.*?)(\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2})/,
      ]

      for (const pattern of patterns) {
        const matches = details.match(pattern)
        if (matches) {
          const dateStr = matches[3] || matches[2] // Get date from the appropriate capture group
          const user = matches[2] || 'Unknown'
          const actualDetails = matches[1].trim()

          // Parse the date string
          try {
            const date = parse(dateStr, 'dd-MM-yyyy HH:mm:ss', new Date())
            if (isValid(date)) {
              return {
                id: log.id,
                action: action.trim(),
                details: actualDetails,
                timestamp: date,
                user: user.trim()
              }
            }
          } catch (e) {
            console.warn('Failed to parse date:', dateStr)
          }
        }
      }

      // If no date pattern matches, return record without timestamp
      return {
        id: log.id,
        action: action.trim(),
        details: details,
        timestamp: null,
        user: 'Unknown'
      }
    } catch (e) {
      console.warn('Failed to parse audit record:', log)
      return null
    }
  }

  // Filter logs based on search, action, and date
  const filteredLogs = React.useMemo(() => {
    if (!logs) return []
    
    return logs
      .map(parseAuditRecord)
      .filter(Boolean) // Remove null entries
      .filter(log => {
        if (!log) return false
        
        const matchesSearch = 
          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesAction = 
          selectedAction === 'all' || 
          log.action.toLowerCase() === selectedAction.toLowerCase()
        
        const matchesDate = 
          !selectedDate || !log.timestamp ? true :
          format(log.timestamp, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        
        return matchesSearch && matchesAction && matchesDate
      })
      .sort((a, b) => {
        if (!a?.timestamp && !b?.timestamp) return 0
        if (!a?.timestamp) return 1
        if (!b?.timestamp) return -1
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
  }, [logs, searchQuery, selectedAction, selectedDate])

  // Function to get the appropriate color and icon for the action
  const getActionStyles = (action: string): { color: string; bgColor: string } => {
    switch (action.toLowerCase()) {
      case 'updated':
        return { color: 'text-blue-500', bgColor: 'bg-blue-50' }
      case 'added':
        return { color: 'text-green-500', bgColor: 'bg-green-50' }
      case 'deleted':
        return { color: 'text-red-500', bgColor: 'bg-red-50' }
      default:
        return { color: 'text-gray-500', bgColor: 'bg-gray-50' }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Recent system activities and changes
              {isLoading && ' (Loading...)'}
              {isError && ` (Error: ${error?.message})`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by details or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={selectedAction}
              onValueChange={setSelectedAction}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="added">Added</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(selectedAction !== 'all' || selectedDate || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedAction('all')
                  setSelectedDate(undefined)
                  setSearchQuery('')
                }}
                className="h-10"
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading audit logs...'
            ) : (
              <>
                Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
                {logs && ` (Total: ${logs.length})`}
              </>
            )}
          </div>

          {isError ? (
            <div className="flex items-center gap-2 text-red-500 p-4 border rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">Error loading audit logs</p>
                <p className="text-sm">{error?.message || 'An unknown error occurred'}</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[500px] rounded-md border">
              <div className="space-y-1 p-4">
                {!isLoading && (!logs || logs.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <p>No audit logs found</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2"
                    >
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {filteredLogs.map((log) => {
                      if (!log) return null
                      const { color, bgColor } = getActionStyles(log.action)
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="group rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${color} ${bgColor}`}>
                                  {log.action}
                                </span>
                                <span className="font-medium">{log.details}</span>
                              </div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>By {log.user}</span>
                                {log.timestamp && (
                                  <>
                                    <span>•</span>
                                    <span>{format(log.timestamp, "MMM d, yyyy 'at' h:mm a")}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
                {isLoading && (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 