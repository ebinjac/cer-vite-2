import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, Label } from 'recharts'
import { cn } from '@/lib/utils'

// Define blue color palette for charts
const BLUE_COLORS = [
  '#0ea5e9', // sky blue
  '#2563eb', // blue
  '#3b82f6', // primary blue
  '#1d4ed8', // darker blue
  '#0284c7', // light blue
];

export interface CertificateStatusPieChartProps {
  statusData: { status: string; value: number }[]
  statusConfig: Record<string, { label: string; color: string }>
  typeData: { type: string; value: number }[]
  typeConfig: Record<string, { label: string; color: string }>
  renewalData?: { status: string; value: number }[]
  renewalConfig?: Record<string, { label: string; color: string }>
  title?: string
  description?: string
  className?: string
}

export function CertificateStatusPieChart({
  statusData,
  statusConfig,
  typeData,
  typeConfig,
  renewalData = [],
  renewalConfig = {},
  title = 'Certificates',
  description = 'Certificates Stats',
  className = '',
}: CertificateStatusPieChartProps) {
  // Determine which tabs to show
  const hasTypeTab = typeData.length > 0 && Object.keys(typeConfig).length > 0
  const hasRenewalTab = renewalData.length > 0 && Object.keys(renewalConfig).length > 0
  const tabOptions = [
    { key: 'status', label: 'Status' },
    ...(hasRenewalTab ? [{ key: 'renewal', label: 'Renewal Process' }] : []),
    ...(hasTypeTab ? [{ key: 'types', label: 'Types' }] : []),
  ]
  const [tab, setTab] = React.useState(tabOptions[0].key as 'status' | 'types' | 'renewal')

  // Get data for current tab
  let pieData, tabDescription
  if (tab === 'status') {
    pieData = statusData
    tabDescription = 'Active, Pending, Expired'
  } else if (tab === 'renewal') {
    pieData = renewalData
    tabDescription = 'Automated vs Manual'
  } else {
    pieData = typeData
    tabDescription = 'Distribution by Type'
  }
  const total = React.useMemo(() => pieData.reduce((acc, curr) => acc + curr.value, 0), [pieData])

  // Get color for a specific item
  const getItemColor = (index: number) => BLUE_COLORS[index % BLUE_COLORS.length]

  // Footer content for each tab
  const renderFooter = () => {
    if (tab === 'status') {
      return (
        <div className="grid grid-cols-3 gap-1 w-full">
          {statusData.map((entry, index) => (
            <div key={entry.status} className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getItemColor(index) }} 
                />
                <span className="text-xs text-muted-foreground">{statusConfig[entry.status]?.label || entry.status}</span>
              </div>
              <span className="text-sm font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    if (tab === 'renewal') {
      return (
        <div className="grid grid-cols-2 gap-1 w-full">
          {renewalData.map((entry, index) => (
            <div key={entry.status} className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getItemColor(index) }} 
                />
                <span className="text-xs text-muted-foreground">{renewalConfig[entry.status]?.label || entry.status}</span>
              </div>
              <span className="text-sm font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    // types
    return (
      <div className="grid grid-cols-2 gap-1 w-full">
        {typeData.slice(0, 4).map((entry, index) => (
          <div key={entry.type} className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getItemColor(index) }} 
              />
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{typeConfig[entry.type]?.label || entry.type}</span>
            </div>
            <span className="text-sm font-semibold">{entry.value}</span>
          </div>
        ))}
        {typeData.length > 4 && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Others</span>
            <span className="text-sm font-semibold">{typeData.slice(4).reduce((acc, curr) => acc + curr.value, 0)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="items-center pb-1 pt-3 space-y-0.5">
        {tabOptions.length > 1 && (
          <Tabs value={tab} onValueChange={v => setTab(v as 'status' | 'types' | 'renewal')} className="w-full">
            <TabsList className="mt-1 mb-1 w-full flex justify-center h-8">
              {tabOptions.map(opt => (
                <TabsTrigger key={opt.key} value={opt.key} className="text-xs py-1 px-2">{opt.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <CardDescription className="text-xs">{tabDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 px-2 pt-2 pb-2 flex items-center justify-center">
        <div className="mx-auto aspect-square max-h-[280px] w-full flex items-center justify-center">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }} width={280} height={280}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey={tab === 'types' ? 'type' : 'status'}
              innerRadius={70}
              outerRadius={110}
              strokeWidth={3}
              stroke="#fff"
              cx="50%"
              cy="50%"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={tab === 'types' 
                    ? `cell-${(entry as any).type}` 
                    : `cell-${(entry as any).status}`
                  }
                  fill={getItemColor(index)}
                />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {total}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                          {tab === 'renewal' ? 'Service IDs' : 'Certs'}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-2 pb-2 px-2 mt-0">{renderFooter()}</CardFooter>
    </Card>
  )
} 