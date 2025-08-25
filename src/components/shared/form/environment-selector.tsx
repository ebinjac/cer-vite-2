import { type Control, Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from './form-field';
import { cn } from '@/lib/utils';

interface EnvironmentSelectorProps {
  control: Control<any>;
  name: string;
  error?: string;
  required?: boolean;
  environments?: Array<{ value: string; label: string; color: string }>;
}

const defaultEnvironments = [
  { value: 'E1', label: 'E1 (Production)', color: 'bg-green-500' },
  { value: 'E2', label: 'E2 (Staging)', color: 'bg-amber-500' },
  { value: 'E3', label: 'E3 (Development)', color: 'bg-blue-500' },
];

export const EnvironmentSelector = ({ 
  control, 
  name, 
  error,
  required = true,
  environments = defaultEnvironments
}: EnvironmentSelectorProps) => {
  return (
    <FormField 
      label="Environment" 
      required={required}
      error={error}
      helpText="Select the deployment environment"
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className={cn(
              "h-11 transition-all duration-200 bg-background border-2",
              error 
                ? "border-destructive focus-visible:ring-destructive/20" 
                : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
            )}>
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {environments.map(env => (
                <SelectItem key={env.value} value={env.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", env.color)} />
                    {env.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
};
