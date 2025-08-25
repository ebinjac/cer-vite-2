// components/form/ApplicationSelector.tsx
import { useState } from 'react';
import { type Control, Controller } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormField } from './form-field';
import { useApplications } from '@/hooks/use-applications-form';
import { cn } from '@/lib/utils';

interface ApplicationSelectorProps {
  control: Control<any>;
  name: string;
  teamId: string | null;
  error?: string;
  required?: boolean;
}

export const ApplicationSelector = ({ 
  control, 
  name, 
  teamId, 
  error,
  required = true 
}: ApplicationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { data: applications = [], isLoading, error: fetchError } = useApplications(teamId);

  return (
    <FormField 
      label="Application" 
      required={required}
      error={error}
      helpText="Select the application this resource belongs to"
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full h-11 justify-between transition-all duration-200 bg-background border-2",
                  error 
                    ? "border-destructive focus-visible:ring-destructive/20" 
                    : "border-border focus-visible:ring-primary/20 focus-visible:border-primary"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading applications...
                  </>
                ) : fetchError ? (
                  <span className="text-destructive">Failed to load applications</span>
                ) : field.value ? (
                  applications.find(app => app === field.value) || field.value
                ) : (
                  <span className="text-muted-foreground">Select application</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Search application..." className="h-9" />
                <CommandEmpty>No application found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : fetchError ? (
                    <div className="flex items-center justify-center p-6 text-sm text-destructive">
                      {fetchError.message}
                    </div>
                  ) : (
                    applications.map(app => (
                      <CommandItem
                        key={app}
                        value={app}
                        onSelect={() => {
                          field.onChange(app);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', field.value === app ? 'opacity-100' : 'opacity-0')} />
                        {app}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
    </FormField>
  );
};
