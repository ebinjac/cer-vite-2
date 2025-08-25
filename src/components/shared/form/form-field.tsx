import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string | ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormField = ({ 
  label, 
  required, 
  error, 
  helpText, 
  children, 
  className 
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
        {label}
        {required && <span className="text-destructive">*</span>}
        {helpText && (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-80 p-3">
                {typeof helpText === 'string' ? <p className="text-sm">{helpText}</p> : helpText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </label>
      {children}
      {error && (
        <motion.p 
          className="text-xs text-destructive font-medium"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
