import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Label } from 'recharts'

export interface CertificateTypePieChartProps {
  data: { type: string; value: number }[]
  config: Record<string, { label: string; color: string }>
  title?: string
  description?: string
}

export function CertificateTypePieChart({ data, config, title = 'Certificate Types', description = 'Distribution by Type' }: CertificateTypePieChartProps) {
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
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
                          Certs
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
              {data.map((entry, idx) => (
                <Cell key={`cell-${entry.type}`} fill={config[entry.type]?.color || '#8884d8'} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 border-t pt-4 mt-2">
        {data.map((entry, idx) => (
          <div key={entry.type} className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">{config[entry.type]?.label || entry.type}</span>
            <span className="text-lg font-semibold">{entry.value}</span>
          </div>
        ))}
      </CardFooter>
    </Card>
  )
} 