import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlanCertificates } from '@/hooks/use-plan-certificates'
import { usePlanServiceIds } from '@/hooks/use-plan-service-ids'
import { useTeamStore } from '@/store/team-store'
import { BarChart3, FileCheck, Key, CalendarIcon, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function RenewalMetrics() {
  const { data: allCertificates } = usePlanCertificates()
  const { data: allServiceIds } = usePlanServiceIds()
  const selectedTeam = useTeamStore((state) => state.selectedTeam)
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showInProgress, setShowInProgress] = React.useState(true)
  const [showCompleted, setShowCompleted] = React.useState(true)
  
  // Filter by selected team
  const certificates = allCertificates?.filter(cert => 
    selectedTeam ? cert.renewingTeamName === selectedTeam : true
  )
  const serviceIds = allServiceIds?.filter(svc => 
    selectedTeam ? svc.renewingTeamName === selectedTeam : true
  )

  // Get renewals for selected month
  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number)

  const getRenewalsForMonth = (items: any[] | undefined) => {
    if (!items) return []
    return items.filter(item => {
      const renewalDate = new Date(item.renewalDate)
      return renewalDate.getMonth() + 1 === selectedMonthNum && 
             renewalDate.getFullYear() === selectedYear &&
             (
               (showInProgress && item.currentStatus === 'pending') ||
               (showCompleted && item.currentStatus === 'completed')
             )
    })
  }

  const currentMonthCertRenewals = getRenewalsForMonth(certificates)
  const currentMonthServiceRenewals = getRenewalsForMonth(serviceIds)

  // Get completed vs pending renewals
  const completedCertRenewals = currentMonthCertRenewals.filter(
    cert => cert.currentStatus === 'completed'
  )
  const completedServiceRenewals = currentMonthServiceRenewals.filter(
    svc => svc.currentStatus === 'completed'
  )

  // Generate last 12 months for selection
  const getLast12Months = () => {
    const months = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' })
      months.push({ value, label })
    }
    return months
  }

  const months = getLast12Months()

  const metricCardStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  }

  const metricStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  }

  const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#E5E7EB'
  }

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const filterContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1rem'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Renewal Metrics {selectedTeam && `- ${selectedTeam}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={filterContainerStyle}>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[240px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={showInProgress}
                  onCheckedChange={setShowInProgress}
                >
                  Show In Progress
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                >
                  Show Completed
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div style={metricCardStyle}>
            <div style={metricStyle}>
              <div style={iconContainerStyle}>
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div style={statsStyle}>
                <div style={valueStyle}>
                  {currentMonthCertRenewals?.length || 0}
                </div>
                <div style={labelStyle}>
                  Certificates Renewed This Month
                </div>
              </div>
            </div>

            <div style={metricStyle}>
              <div style={iconContainerStyle}>
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div style={statsStyle}>
                <div style={valueStyle}>
                  {currentMonthServiceRenewals?.length || 0}
                </div>
                <div style={labelStyle}>
                  Service IDs Renewed This Month
                </div>
              </div>
            </div>

            <div style={metricStyle}>
              <div style={iconContainerStyle}>
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div style={statsStyle}>
                <div style={valueStyle}>
                  {completedCertRenewals?.length || 0}
                </div>
                <div style={labelStyle}>
                  Completed Certificate Renewals
                </div>
              </div>
            </div>

            <div style={metricStyle}>
              <div style={iconContainerStyle}>
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <div style={statsStyle}>
                <div style={valueStyle}>
                  {completedServiceRenewals?.length || 0}
                </div>
                <div style={labelStyle}>
                  Completed Service ID Renewals
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentMonthCertRenewals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Certificate Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Renewed By</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthCertRenewals.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>{cert.commonName}</TableCell>
                    <TableCell>{new Date(cert.renewalDate).toLocaleDateString()}</TableCell>
                    <TableCell>{cert.renewedBy}</TableCell>
                    <TableCell>{cert.renewingTeamName}</TableCell>
                    <TableCell>{getStatusBadge(cert.currentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {currentMonthServiceRenewals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Service ID Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service ID</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Renewed By</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMonthServiceRenewals.map((svc) => (
                  <TableRow key={svc.id}>
                    <TableCell>{svc.scid}</TableCell>
                    <TableCell>{new Date(svc.renewalDate).toLocaleDateString()}</TableCell>
                    <TableCell>{svc.renewedBy}</TableCell>
                    <TableCell>{svc.renewingTeamName}</TableCell>
                    <TableCell>{getStatusBadge(svc.currentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 