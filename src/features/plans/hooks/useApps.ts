import { useQuery } from '@tanstack/react-query';
import { listApps } from '../../../api/apps';
import { appKeys } from '../../../api/queryKeys';

export function useActiveApps() {
  return useQuery({
    queryKey: appKeys.list({ isActive: true, size: 100 }),
    queryFn: () => listApps({ isActive: true, size: 100 }),
    staleTime: 5 * 60 * 1000,
  });
}
