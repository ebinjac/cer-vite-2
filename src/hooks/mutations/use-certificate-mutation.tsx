// hooks/useCertificateMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CERTIFICATE_SAVE_API } from '@/lib/api-endpoints';
import type { CertificateFormData } from '@/components/shared/form/form';

export const useCertificateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CertificateFormData & { renewingTeamName: string }) => {
      const payload = {
        ...data,
        validTo: data.isAmexCert === 'No' && data.validTo 
          ? data.validTo.toISOString().slice(0, 10) 
          : '',
        serverName: data.serverName ?? '',
        keystorePath: data.keystorePath ?? '',
        uri: data.uri ?? '',
        comment: data.comment ?? '',
      };

      const response = await fetch(CERTIFICATE_SAVE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to add certificate: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Certificate added successfully!', {
        description: 'The certificate has been saved.',
      });
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: (error: Error) => {
      let message = 'An error occurred while saving the certificate.';
      
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        message = 'Network error: Unable to reach the server. Please check your connection.';
      } else if (error.message) {
        message = error.message;
      }

      toast.error('Failed to add certificate', { description: message });
    },
  });
};
