import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Label } from 'recharts'

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

  // Pie chart data/config for current tab
  let pieData, pieConfig, tabDescription
  if (tab === 'status') {
    pieData = statusData
    pieConfig = statusConfig
    tabDescription = 'Active, Pending, Expired'
  } else if (tab === 'renewal') {
    pieData = renewalData
    pieConfig = renewalConfig
    tabDescription = 'Automated vs Manual'
  } else {
    pieData = typeData
    pieConfig = typeConfig
    tabDescription = 'Distribution by Type'
  }
  const total = React.useMemo(() => pieData.reduce((acc, curr) => acc + curr.value, 0), [pieData])

  // Footer content for each tab
  const renderFooter = () => {
    if (tab === 'status') {
      const getCount = (status: string) => statusData.find(d => d.status === status)?.value || 0
      return (
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Active</span>
            <span className="text-lg font-semibold">{getCount('active')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Pending</span>
            <span className="text-lg font-semibold">{getCount('pending')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Expired</span>
            <span className="text-lg font-semibold">{getCount('expired')}</span>
          </div>
        </div>
      )
    }
    if (tab === 'renewal') {
      const getCount = (status: string) => renewalData.find(d => d.status === status)?.value || 0
      return (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Automated</span>
            <span className="text-lg font-semibold">{getCount('automated')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Manual</span>
            <span className="text-lg font-semibold">{getCount('manual')}</span>
          </div>
        </div>
      )
    }
    // types
    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        {typeData.map((entry, idx) => (
          <div key={entry.type} className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">{typeConfig[entry.type]?.label || entry.type}</span>
            <span className="text-lg font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={className + ' flex flex-col'}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {tabOptions.length > 1 && (
          <Tabs value={tab} onValueChange={v => setTab(v as 'status' | 'types' | 'renewal')} className="w-full">
            <TabsList className="mt-2 mb-2 w-full flex justify-center">
              {tabOptions.map(opt => (
                <TabsTrigger key={opt.key} value={opt.key}>{opt.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <CardDescription>{tabDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={pieData}
              dataKey={'value'}
              nameKey={tab === 'types' ? 'type' : 'status'}
              innerRadius={60}
              strokeWidth={5}
              cx="50%"
              cy="50%"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {total}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          {tab === 'renewal' ? 'Service IDs' : 'Certs'}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
              {pieData.map((entry, idx) => (
                <Cell
                  key={tab === 'types' ? `cell-${(entry as any).type}` : `cell-${(entry as any).status}`}
                  fill={pieConfig[tab === 'types' ? (entry as any).type : (entry as any).status]?.color || '#8884d8'}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="border-t pt-4 mt-2">{renderFooter()}</CardFooter>
    </Card>
  )
} 