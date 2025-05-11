import * as React from 'react'

interface SummaryCardProps {
  title: string;
  count: number;
  suffix: string;
  isLoading: boolean;
  chartData: any[];
}

export function SummaryCard({ title, count, suffix, isLoading, chartData }: SummaryCardProps) {
  return (
    <div className="overflow-hidden h-[140px] bg-card rounded-xl border flex flex-col justify-between p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-baseline">
          <div className="text-3xl font-semibold">
            {isLoading ? (
              <div className="h-8 w-12 bg-gray-200 animate-pulse rounded-md"></div>
            ) : (
              count
            )}
          </div>
          <div className="ml-1 text-xs text-gray-500">{suffix}</div>
        </div>
        <div className="w-20 h-16">
          {/* Placeholder for chart */}
          <div className="w-full h-full flex items-end">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className="bg-blue-100 mx-0.5 rounded-sm w-1.5" 
                style={{ 
                  height: `${Math.random() * 60 + 20}%`,
                  opacity: i === 6 ? 1 : 0.7
                }}
              ></div>
            ))}
            <div className="bg-blue-500 mx-0.5 rounded-sm w-1.5 h-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 