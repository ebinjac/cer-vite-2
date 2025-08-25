import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  error: string;
  title?: string;
  onDismiss?: () => void;
}

export const ErrorAlert = ({ 
  error, 
  title = "Error", 
  onDismiss 
}: ErrorAlertProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/5 relative">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="pr-8">{error}</AlertDescription>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-destructive/10"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Alert>
    </motion.div>
  );
};
