import { useQuery } from '@tanstack/react-query';
import { APPLICATION_LIST_API } from '@/lib/api-endpoints';

export const useApplications = (teamId: string | null) => {
  return useQuery({
    queryKey: ['applications', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');
      
      const response = await fetch(APPLICATION_LIST_API(teamId));
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const text = await response.text();
      try {
        return JSON.parse(text) as string[];
      } catch {
        return text
          .replace(/\[|\]/g, '')
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
