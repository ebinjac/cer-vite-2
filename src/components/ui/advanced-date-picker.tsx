"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { eachMonthOfInterval, eachYearOfInterval, endOfYear, format, isAfter, isBefore, startOfYear } from "date-fns"
import { ChevronDown } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface AdvancedDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function AdvancedDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled
}: AdvancedDatePickerProps) {
  const today = new Date()
  const [month, setMonth] = useState(value || today)
  const [date, setDate] = useState<Date | undefined>(value)
  const [isYearView, setIsYearView] = useState(false)
  const startDate = new Date(1980, 6)
  const endDate = new Date(2030, 6)
  const containerRef = useRef<HTMLDivElement>(null)
  const yearScrollRef = useRef<HTMLDivElement>(null)

  // Update internal state when external value changes
  useEffect(() => {
    if (value) {
      setDate(value)
      setMonth(value)
    }
  }, [value])

  // Handle date selection
  const handleSelect = (newDate: Date | undefined) => {
    console.log("Date selected in date picker:", newDate)
    setDate(newDate)
    if (onChange) {
      onChange(newDate)
    }
  }

  const years = eachYearOfInterval({
    start: startOfYear(startDate),
    end: endOfYear(endDate),
  })

  const toggleYearView = () => {
    setIsYearView(!isYearView)
  }

  // Function to handle month selection
  const handleMonthSelect = (selectedMonth: Date) => {
    setMonth(selectedMonth)
    setIsYearView(false)
    
    // If no date is selected yet, set a default date for this month
    if (!date) {
      const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15)
      handleSelect(newDate)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="rounded-md border p-2">
        {/* Custom header with year dropdown */}
        <div className="flex justify-between items-center px-1 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-sm font-medium hover:bg-transparent"
            onClick={toggleYearView}
          >
            {format(month, 'MMMM yyyy')}
            <ChevronDown 
              size={14}
              className={cn(
                "transition-transform duration-200",
                isYearView && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Regular calendar display */}
        {!isYearView && (
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            defaultMonth={value || new Date()}
            disabled={disabled}
            className="border-none p-0"
          />
        )}

        {/* Year and month selection view */}
        {isYearView && (
          <div className="min-h-[240px]">
            <ScrollArea className="h-[240px]" ref={yearScrollRef}>
              {years.map((year) => {
                const months = eachMonthOfInterval({
                  start: startOfYear(year),
                  end: endOfYear(year),
                })
                const isCurrentYear = year.getFullYear() === month.getFullYear()

                return (
                  <div key={year.getFullYear()}>
                    <Collapsible defaultOpen={isCurrentYear} className="border-b border-border">
                      <CollapsibleTrigger asChild>
                        <Button
                          className="w-full justify-start text-left text-sm font-medium py-2 px-3"
                          variant="ghost"
                        >
                          <ChevronDown 
                            size={14} 
                            className="mr-2 transform transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" 
                          />
                          {year.getFullYear()}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid grid-cols-3 gap-2 p-2">
                          {months.map((monthDate) => {
                            const isDisabled = isBefore(monthDate, startDate) || isAfter(monthDate, endDate)
                            const isCurrentMonth =
                              monthDate.getMonth() === month.getMonth() &&
                              year.getFullYear() === month.getFullYear()

                            return (
                              <Button
                                key={monthDate.getTime()}
                                variant={isCurrentMonth ? "default" : "outline"}
                                size="sm"
                                className="h-7"
                                disabled={isDisabled}
                                onClick={() => handleMonthSelect(monthDate)}
                              >
                                {format(monthDate, "MMM")}
                              </Button>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )
              })}
            </ScrollArea>
          </div>
        )}
      </div>
      
      {placeholder && !date && (
        <p className="text-muted-foreground mt-2 text-sm">{placeholder}</p>
      )}
    </div>
  )
} 