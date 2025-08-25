import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DrawerClose } from '@/components/ui/drawer';
import { Loader2, Plus } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  submitText: string;
  submitIcon?: ReactNode;
  onCancel?: () => void;
  disabled?: boolean;
}

export const FormActions = ({ 
  isSubmitting, 
  submitText, 
  submitIcon = <Plus className="mr-2 h-4 w-4" />,
  onCancel,
  disabled = false
}: FormActionsProps) => {
  return (
    <motion.div 
      className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      {onCancel ? (
        <Button 
          type="button" 
          variant="outline" 
          disabled={isSubmitting}
          onClick={onCancel}
          className="h-12 flex-1 sm:flex-none sm:min-w-[140px] border-2"
        >
          Cancel
        </Button>
      ) : (
        <DrawerClose asChild>
          <Button 
            type="button" 
            variant="outline" 
            disabled={isSubmitting}
            className="h-12 flex-1 sm:flex-none sm:min-w-[140px] border-2"
          >
            Cancel
          </Button>
        </DrawerClose>
      )}
      
      <Button 
        type="submit" 
        disabled={isSubmitting || disabled} 
        className="h-12 flex-1 sm:flex-none sm:min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitText.replace('Add', 'Creating')}...
          </>
        ) : (
          <>
            {submitIcon}
            {submitText}
          </>
        )}
      </Button>
    </motion.div>
  );
};
