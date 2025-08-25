import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  Calendar, 
  MessageSquare, 
  Settings2,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { FormField } from '@/components/shared/form/form-field';
import { FormCard } from '@/components/shared/form/form-card';
import { ApplicationSelector } from '@/components/shared/form/application-selector';
import { EnvironmentSelector } from '@/components/shared/form/environment-selector';
import { DatePickerField } from '@/components/shared/form/date-picker';
import { CommentField } from '@/components/shared/form/commet-field';
import { FormActions } from '@/components/shared/form/form-actions';
import { ErrorAlert } from '@/components/shared/error-alert';
import { useCertificateMutation } from '@/hooks/mutations/use-certificate-mutation';
import { useTeamStore } from '@/store/team-store';
import type { CertificateFormData } from '@/components/shared/form/form';

const certificateSchema = z.object({
  commonName: z.string().min(1, 'Common Name is required'),
  serialNumber: z.string().min(1, 'Serial Number is required'),
  centralID: z.string().min(1, 'Central ID is required'),
  applicationName: z.string().min(1, 'Application is required'),
  isAmexCert: z.enum(['Yes', 'No']),
  validTo: z.date().optional(),
  environment: z.string().optional(),
  comment: z.string().optional(),
  serverName: z.string().optional(),
  keystorePath: z.string().optional(),
  uri: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.isAmexCert === 'No') {
    if (!values.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validTo'],
        message: 'Expiry Date is required for Non Amex certificates',
      });
    }
    if (!values.environment || !['E1', 'E2', 'E3'].includes(values.environment)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['environment'],
        message: 'Environment is required for Non Amex certificates',
      });
    }
  }
});

interface CertificateFormProps {
  onSuccess?: () => void;
}

export const CertificateForm = ({ onSuccess }: CertificateFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { selectedTeam } = useTeamStore();
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      isAmexCert: 'Yes',
    },
  });

  const mutation = useCertificateMutation();
  const isAmexCert = watch('isAmexCert');

  const onSubmit = (data: CertificateFormData) => {
    if (!selectedTeam) return;
    
    mutation.mutate(
      { ...data, renewingTeamName: selectedTeam },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  const certTypeInfo = {
    Yes: {
      title: "Amex Certificate",
      description: "Internal certificates issued by American Express Certificate Authority",
      icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
      badgeClass: "bg-blue-100 text-blue-800 border-blue-300"
    },
    No: {
      title: "Non-Amex Certificate", 
      description: "External certificates issued by third-party Certificate Authorities",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300"
    }
  };

  const currentCertType = certTypeInfo[isAmexCert];

  return (
    <TooltipProvider>
      <div className="h-full bg-gradient-to-b from-background to-muted/30">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6 overflow-y-auto h-full">
          <AnimatePresence>
            {mutation.error && (
              <ErrorAlert 
                error={mutation.error.message}
                onDismiss={() => mutation.reset()}
              />
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Add New Certificate</h1>
              <p className="text-muted-foreground text-lg">Create a new certificate entry in the system</p>
            </div>
            
            {/* Certificate Type Display */}
            <Card className={cn("border-2", currentCertType.badgeClass.includes('blue') ? "border-blue-200 bg-blue-50/50" : "border-emerald-200 bg-emerald-50/50")}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  {currentCertType.icon}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{currentCertType.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{currentCertType.description}</p>
                  </div>
                  <Badge variant="secondary" className={cn("text-sm font-medium", currentCertType.badgeClass)}>
                    {isAmexCert === 'Yes' ? 'Internal' : 'External'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
            
            {/* Primary Information */}
            <FormCard title="Primary Information" icon={<ClipboardList className="h-5 w-5" />}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField 
                  label="Common Name" 
                  required 
                  error={errors.commonName?.message}
                  helpText="The domain name or identifier for the certificate"
                >
                  <Input 
                    {...register('commonName')} 
                    placeholder="e.g., example.com or *.example.com" 
                    className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                  />
                </FormField>
                
                <FormField 
                  label="Serial Number" 
                  required 
                  error={errors.serialNumber?.message}
                  helpText="Unique identifier assigned by the Certificate Authority"
                >
                  <Input 
                    {...register('serialNumber')} 
                    placeholder="e.g., 00a1b2c3d4e5f6..." 
                    className="h-11 font-mono text-sm bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                  />
                </FormField>
                
                <FormField 
                  label="Central ID" 
                  required 
                  error={errors.centralID?.message}
                >
                  <Input 
                    {...register('centralID')} 
                    placeholder="Enter Central ID" 
                    className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                  />
                </FormField>
                
                <FormField 
                  label="Certificate Type" 
                  required 
                  error={errors.isAmexCert?.message}
                  helpText="Choose between Amex internal certificates or external third-party certificates"
                >
                  <Controller
                    name="isAmexCert"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200">
                          <SelectValue placeholder="Select certificate type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-blue-600" />
                              Amex Certificate
                            </div>
                          </SelectItem>
                          <SelectItem value="No">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              Non-Amex Certificate
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                
                <div className="lg:col-span-2">
                  <ApplicationSelector 
                    control={control}
                    name="applicationName"
                    teamId={selectedTeam}
                    error={errors.applicationName?.message}
                  />
                </div>
              </div>
            </FormCard>
            
            {/* Non-Amex Configuration */}
            {isAmexCert === 'No' && (
              <FormCard 
                title="Certificate Configuration" 
                icon={<Calendar className="h-5 w-5" />}
                variant="secondary"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DatePickerField
                    control={control}
                    name="validTo"
                    label="Expiry Date"
                    error={errors.validTo?.message}
                    helpText="When this certificate expires"
                  />
                  
                  <EnvironmentSelector
                    control={control}
                    name="environment"
                    error={errors.environment?.message}
                  />
                </div>
              </FormCard>
            )}
            
            {/* Comments */}
            <FormCard title="Additional Information" icon={<MessageSquare className="h-5 w-5" />} variant="muted">
              <CommentField 
                register={register}
                error={errors.comment?.message}
                placeholder="Add any relevant comments about this certificate..."
              />
            </FormCard>
            
            {/* Advanced Options */}
            <Card className="border-2 border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Settings2 className="h-5 w-5" />
                    Server Configuration
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(prev => !prev)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      showAdvanced && "rotate-180"
                    )} />
                    <span className="ml-1">{showAdvanced ? 'Hide' : 'Show'} Options</span>
                  </Button>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <FormField label="Server Name">
                          <Input 
                            {...register('serverName')} 
                            placeholder="e.g., srv-app-01" 
                            className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                          />
                        </FormField>
                        
                        <FormField label="Keystore Path">
                          <Input 
                            {...register('keystorePath')} 
                            placeholder="e.g., /path/to/keystore" 
                            className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                          />
                        </FormField>
                        
                        <FormField label="URI">
                          <Input 
                            {...register('uri')} 
                            placeholder="e.g., https://example.com" 
                            className="h-11 bg-background border-2 border-border focus-visible:border-primary transition-all duration-200"
                          />
                        </FormField>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
            
            {/* Actions */}
            <FormActions 
              isSubmitting={isSubmitting || mutation.isPending}
              submitText="Add Certificate"
              disabled={!selectedTeam}
            />
          </motion.div>
        </form>
      </div>
    </TooltipProvider>
  );
};
