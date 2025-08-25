import type { UseFormRegister } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './form-field';

interface CommentFieldProps {
  register: UseFormRegister<any>;
  error?: string;
  rows?: number;
  placeholder?: string;
}

export const CommentField = ({ 
  register, 
  error, 
  rows = 4,
  placeholder = "Add any relevant comments..."
}: CommentFieldProps) => {
  return (
    <FormField 
      label="Comments" 
      error={error}
      helpText="Optional additional information"
    >
      <Textarea 
        {...register('comment')} 
        placeholder={placeholder}
        rows={rows} 
        className="resize-none bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
      />
    </FormField>
  );
};
