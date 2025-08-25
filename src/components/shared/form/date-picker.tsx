// components/form/DatePickerField.tsx
import { type Control, Controller } from 'react-hook-form';
import DatePicker from '@/components/ui/DatePicker';
import { FormField } from './form-field';

interface DatePickerFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export const DatePickerField = ({ 
  control, 
  name, 
  label, 
  placeholder = "Select date",
  error,
  required = true,
  helpText
}: DatePickerFieldProps) => {
  return (
    <FormField 
      label={label} 
      required={required}
      error={error}
      helpText={helpText}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DatePicker
            placeholder={placeholder}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </FormField>
  );
};
