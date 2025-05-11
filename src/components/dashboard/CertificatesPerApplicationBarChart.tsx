import * as React from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, LabelList } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'

export interface CertificatesPerApplicationBarChartProps {
  data: { application: string; active: number; pending: number; expired: number }[]
  config: Record<string, { label: string; color: string }>
  className?: string
}

export function CertificatesPerApplicationBarChart({ data, config, className = '' }: CertificatesPerApplicationBarChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Certificates per Application</CardTitle>
        <CardDescription>Stacked by Status (Active, Pending, Expired)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ChartContainer config={config} className="h-full">
            <BarChart accessibilityLayer data={data} height={250}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="application"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="active"
                stackId="a"
                fill={config.active?.color || '#22c55e'}
                radius={[0, 0, 4, 4]}
              >
                <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
              </Bar>
              <Bar
                dataKey="pending"
                stackId="a"
                fill={config.pending?.color || '#fbbf24'}
                radius={[0, 0, 4, 4]}
              >
                <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
              </Bar>
              <Bar
                dataKey="expired"
                stackId="a"
                fill={config.expired?.color || '#ef4444'}
                radius={[4, 4, 0, 0]}
              >
                <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Stacked by certificate status for each application
        </div>
        <div className="leading-none text-muted-foreground">
          Showing all applications with at least one certificate
        </div>
      </CardFooter>
    </Card>
  )
} 