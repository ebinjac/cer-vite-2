// hooks/useServiceIdMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SERVICEID_CREATE_API } from '@/lib/api-endpoints';
import type { ServiceIdFormData } from '@/components/shared/form/form';

export const useServiceIdMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceIdFormData & { renewingTeamName: string }) => {
      const payload = {
        ...data,
        expDate: data.expDate.toISOString().slice(0, 10),
        comment: data.comment ?? '',
      };

      const response = await fetch(SERVICEID_CREATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to add service ID: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Service ID added successfully!', {
        description: 'The service ID has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['service-ids'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to add service ID', { description: error.message });
    },
  });
};
