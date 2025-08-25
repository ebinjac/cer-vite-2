import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

const variantStyles = {
  primary: "border-primary/20 bg-primary/5",
  secondary: "border-emerald-200 bg-emerald-50/30", 
  muted: "border-muted bg-muted/30"
};

const titleStyles = {
  primary: "text-primary",
  secondary: "text-emerald-700",
  muted: "text-muted-foreground"
};

export const FormCard = ({ 
  title, 
  icon, 
  children, 
  variant = 'primary',
  className 
}: FormCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("border-2", variantStyles[variant], className)}>
        <CardHeader className="pb-4">
          <CardTitle className={cn("flex items-center gap-2", titleStyles[variant])}>
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
};
