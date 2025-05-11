"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StepperContextValue {
  value: number
  onChange?: (value: number) => void
}

const StepperContext = React.createContext<StepperContextValue>({
  value: 1,
  onChange: () => {},
})

type StepperProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, value, defaultValue = 1, onChange, ...props }, ref) => {
    const [stepValue, setStepValue] = React.useState(defaultValue)

    const actualValue = value !== undefined ? value : stepValue

    const handleValueChange = React.useCallback(
      (newValue: number) => {
        setStepValue(newValue)
        onChange?.(newValue)
      },
      [onChange]
    )

    return (
      <StepperContext.Provider
        value={{
          value: actualValue,
          onChange: handleValueChange,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-2 data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
            className
          )}
          data-orientation="horizontal"
          {...props}
        />
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

const StepperItemContext = React.createContext<number>(1)

const StepperItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { step: number }
>(({ className, step, children, ...props }, ref) => {
  return (
    <StepperItemContext.Provider value={step}>
      <div
        ref={ref}
        className={cn("group/stepper flex items-center gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  )
})
StepperItem.displayName = "StepperItem"

const StepperTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { value, onChange } = React.useContext(StepperContext)
  const step = React.useContext(StepperItemContext)

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group/trigger flex items-center gap-2 rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&:has([data-state=checked])]:bg-accent",
        className
      )}
      onClick={() => onChange?.(step)}
      disabled={!onChange}
      {...props}
    >
      {children}
    </button>
  )
})
StepperTrigger.displayName = "StepperTrigger"

const StepperIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { value } = React.useContext(StepperContext)
  const step = React.useContext(StepperItemContext)

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium ring-offset-background transition-colors group-hover/trigger:bg-muted",
        step <= value && "border-primary bg-primary text-primary-foreground",
        className
      )}
      {...props}
    >
      {step}
    </div>
  )
})
StepperIndicator.displayName = "StepperIndicator"

const StepperTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
})
StepperTitle.displayName = "StepperTitle"

const StepperDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
StepperDescription.displayName = "StepperDescription"

const StepperSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { value } = React.useContext(StepperContext)
  const step = React.useContext(StepperItemContext)

  return (
    <div
      ref={ref}
      className={cn(
        "h-[2px] w-full bg-border",
        step <= value && "bg-primary",
        className
      )}
      {...props}
    />
  )
})
StepperSeparator.displayName = "StepperSeparator"

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} 