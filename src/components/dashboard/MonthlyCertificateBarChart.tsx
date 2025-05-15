import { BarChart, Bar, CartesianGrid, XAxis, LabelList, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Define blue color palette
const BLUE_COLORS = {
  expiring: '#3b82f6', // medium blue
  expired: '#1d4ed8'   // darker blue
};

export interface MonthlyCertificateBarChartProps {
  data: { month: string; expiring: number; expired: number }[]
  config?: Record<string, { label: string; color: string }>
  className?: string
}

export function MonthlyCertificateBarChart({ 
  data, 
  config = {
    expiring: { label: 'Expiring Soon', color: BLUE_COLORS.expiring },
    expired: { label: 'Expired', color: BLUE_COLORS.expired }
  }, 
  className = '' 
}: MonthlyCertificateBarChartProps) {
  // Formatter function for value labels
  const formatValue = (value: number): string => {
    return value > 0 ? value.toString() : '';
  };

  // Custom legend style
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex justify-center items-center gap-6 text-sm mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Monthly Certificate Status</CardTitle>
        <CardDescription>
          {data.length > 0 && `${data[0]?.month} - ${data[data.length-1]?.month}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart 
            accessibilityLayer 
            data={data}
            margin={{ top: 30, right: 30, left: 0, bottom: 10 }}
            barGap={8}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={value => value.slice(0, 3)}
            />
            <ChartTooltip 
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />} 
            />
            <Legend 
              content={renderLegend}
              verticalAlign="bottom"
              align="center"
            />
            <Bar 
              dataKey="expiring" 
              name="Expiring Soon"
              fill={BLUE_COLORS.expiring} 
              radius={4} 
            >
              <LabelList 
                dataKey="expiring" 
                position="top" 
                offset={8}
                formatter={formatValue} 
                className="fill-foreground" 
                fontSize={12} 
              />
            </Bar>
            <Bar 
              dataKey="expired" 
              name="Expired"
              fill={BLUE_COLORS.expired} 
              radius={4} 
            >
              <LabelList 
                dataKey="expired" 
                position="top" 
                offset={8}
                formatter={formatValue} 
                className="fill-foreground" 
                fontSize={12} 
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 