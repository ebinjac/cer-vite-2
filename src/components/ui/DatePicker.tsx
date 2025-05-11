"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  label?: string;
  description?: string;
  placeholder?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label = "Date",
      description = "Select a date",
      placeholder = "Select a date",
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col" ref={ref} {...props}>
        {label && <label className="mb-1 text-sm font-medium">{label}</label>}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              {value ? format(value, "PPP") : <span>{placeholder}</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ?? undefined}
              onSelect={day => onChange?.(day ?? null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {description && (
          <span className="text-xs text-muted-foreground mt-1">{description}</span>
        )}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export default DatePicker; 