import * as React from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, LabelList, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Define blue color palette with more blue shades
const BLUE_COLORS = {
  active: '#0ea5e9',  // sky blue
  pending: '#3b82f6', // primary blue
  expired: '#1d4ed8'  // darker blue
};

export interface CertificatesPerApplicationBarChartProps {
  data: { application: string; active: number; pending: number; expired: number }[]
  config?: Record<string, { label: string; color: string }>
  className?: string
}

export function CertificatesPerApplicationBarChart({ 
  data, 
  config = {
    active: { label: 'Active', color: BLUE_COLORS.active },
    pending: { label: 'Pending', color: BLUE_COLORS.pending },
    expired: { label: 'Expired', color: BLUE_COLORS.expired }
  }, 
  className = '' 
}: CertificatesPerApplicationBarChartProps) {
  
  // Custom legend style
  const renderLegend = () => {    
    return (
      <div className="flex justify-center items-center gap-6 text-sm mt-2">
        {Object.entries(BLUE_COLORS).map(([key, color], index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{config[key]?.label || key}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Certificates per Application</CardTitle>
        <CardDescription>Stacked by Status (Active, Pending, Expired)</CardDescription>
      </CardHeader>
      <CardContent className="px-1">
        <ChartContainer config={config} className="max-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              accessibilityLayer 
              data={data} 
              margin={{ top: 16, right: 10, left: 10, bottom: 40 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="application"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="active"
                stackId="a"
                fill={BLUE_COLORS.active}
                radius={[0, 0, 0, 0]}
                name="Active"
              >
                <LabelList 
                  dataKey="active" 
                  position="top" 
                  offset={4}
                  formatter={(value: number) => (value > 0 ? value.toString() : '')} 
                  className="fill-foreground" 
                  fontSize={11} 
                />
              </Bar>
              <Bar
                dataKey="pending"
                stackId="a"
                fill={BLUE_COLORS.pending}
                radius={[0, 0, 0, 0]}
                name="Pending"
              >
                <LabelList 
                  dataKey="pending" 
                  position="top" 
                  offset={4}
                  formatter={(value: number) => (value > 0 ? value.toString() : '')} 
                  className="fill-foreground" 
                  fontSize={11} 
                />
              </Bar>
              <Bar
                dataKey="expired"
                stackId="a"
                fill={BLUE_COLORS.expired}
                radius={[4, 4, 0, 0]}
                name="Expired"
              >
                <LabelList 
                  dataKey="expired" 
                  position="top" 
                  offset={4}
                  formatter={(value: number) => (value > 0 ? value.toString() : '')} 
                  className="fill-foreground" 
                  fontSize={11} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        {renderLegend()}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-0">
        <div className="text-muted-foreground">
          Showing all applications with at least one certificate
        </div>
      </CardFooter>
    </Card>
  )
} 