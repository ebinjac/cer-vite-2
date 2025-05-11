"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon, Loader2Icon } from "lucide-react"

interface StepperContextValue {
  value: number
  onChange?: (value: number) => void
}

const StepperContext = React.createContext<StepperContextValue>({
  value: 1,
  onChange: () => {},
})

type StepperProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
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
      <StepperContext.Provider value={{ value: actualValue, onChange: handleValueChange }}>
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
  const { value } = React.useContext(StepperContext)
  const state = step === value ? "active" : step < value ? "completed" : "pending"

  return (
    <StepperItemContext.Provider value={step}>
      <div
        ref={ref}
        className={cn("group/stepper relative flex items-center gap-2", className)}
        data-state={state}
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
  const state = step === value ? "active" : step < value ? "completed" : "pending"

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium ring-offset-background transition-colors",
        state === "active" && "border-primary bg-primary text-primary-foreground",
        state === "completed" && "border-primary bg-primary text-primary-foreground",
        className
      )}
      {...props}
    >
      {state === "completed" ? (
        <CheckIcon className="h-4 w-4" />
      ) : state === "active" ? (
        <Loader2Icon className="h-4 w-4 animate-spin" />
      ) : (
        step
      )}
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
        "absolute left-10 right-0 top-4 h-[2px] -translate-y-1/2 bg-border",
        step < value && "bg-primary",
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