import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
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

export interface CertificateTypePieChartProps {
  data: { type: string; value: number }[]
  config: Record<string, { label: string; color: string }>
  title?: string
  description?: string
  className?: string
}

export function CertificateTypePieChart({ 
  data, 
  config, 
  title = 'Certificate Types', 
  description = 'Distribution by Type',
  className = ''
}: CertificateTypePieChartProps) {
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data])

  // Get color for a specific item
  const getItemColor = (index: number) => BLUE_COLORS[index % BLUE_COLORS.length]

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="items-center pb-1 pt-3 space-y-0.5">
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 px-2 pt-2 pb-2 flex items-center justify-center">
        <div className="mx-auto aspect-square max-h-[280px] w-full flex items-center justify-center">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }} width={280} height={280}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              innerRadius={70}
              outerRadius={110}
              strokeWidth={3}
              stroke="#fff"
              cx="50%"
              cy="50%"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.type}`}
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
                          Certs
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
      <CardFooter className="grid grid-cols-2 gap-1 border-t pt-2 pb-2 px-2 mt-0">
        {data.slice(0, 4).map((entry, index) => (
          <div key={entry.type} className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getItemColor(index) }} 
              />
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {config[entry.type]?.label || entry.type}
              </span>
            </div>
            <span className="text-sm font-semibold">{entry.value}</span>
          </div>
        ))}
        {data.length > 4 && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Others</span>
            <span className="text-sm font-semibold">{data.slice(4).reduce((acc, curr) => acc + curr.value, 0)}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
} 