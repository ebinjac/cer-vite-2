import { BarChart, Bar, CartesianGrid, XAxis, LabelList } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'

export interface MonthlyCertificateBarChartProps {
  data: { month: string; expiring: number; expired: number }[]
  config: Record<string, { label: string; color: string }>
  className?: string
}

export function MonthlyCertificateBarChart({ data, config, className = '' }: MonthlyCertificateBarChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bar Chart - Stacked + Legend</CardTitle>
        <CardDescription>Monthly Overview ({data[0]?.month} - {data[data.length-1]?.month})</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={value => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="expiring"
              stackId="a"
              fill={config.expiring?.color || 'var(--color-expiring)'}
              radius={[0, 0, 4, 4]}
            >
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
            </Bar>
            <Bar
              dataKey="expired"
              stackId="a"
              fill={config.expired?.color || 'var(--color-expired)'}
              radius={[4, 4, 0, 0]}
            >
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 