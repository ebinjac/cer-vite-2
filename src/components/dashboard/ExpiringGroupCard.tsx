import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ExpiringGroupCardProps {
  title: string;
  isLoading: boolean;
  items: {
    label: string;
    count: number;
    suffix: string;
    colorClass: string;
    onClick?: () => void;
  }[];
}

export function ExpiringGroupCard({ title, isLoading, items }: ExpiringGroupCardProps) {
  return (
    <div className="overflow-hidden h-[140px] bg-card rounded-xl border flex flex-col justify-between p-4">
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        {items.map((item, index) => (
          <div key={index} className="px-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <ExpiringCard 
                      label={item.label}
                      count={item.count}
                      suffix={item.suffix}
                      colorClass={item.colorClass}
                      isLoading={isLoading}
                      onClick={item.onClick}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  {item.count > 0 ? `View details of ${item.count} ${item.suffix}` : `No ${item.suffix} in this range`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ExpiringCardProps {
  label: string;
  count: number;
  suffix: string;
  colorClass: string;
  isLoading: boolean;
  onClick?: () => void;
}

function ExpiringCard({ label, count, suffix, isLoading, colorClass, onClick }: ExpiringCardProps) {
  return (
    <div 
      className={cn(
        "flex flex-col w-full", 
        onClick && count > 0 && "cursor-pointer hover:opacity-80 transition-opacity hover:bg-gray-50 p-1 rounded-md"
      )}
      onClick={() => {
        if (onClick && count > 0) {
          onClick();
        }
      }}
    >
      <div className="flex items-center mb-1">
        <div className={cn("w-2 h-2 rounded-full mr-1", colorClass)}></div>
        <div className="text-[10px]">{label}</div>
      </div>
      <div className="flex items-baseline">
        <span className="text-lg font-medium">
          {isLoading ? (
            <div className="h-6 w-6 animate-pulse rounded-md"></div>
          ) : (
            count
          )}
        </span>
        <span className="text-[10px] text-gray-500 ml-0.5">{suffix}</span>
      </div>
    </div>
  )
} 