import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listPlans, getPlan, type ListPlansParams } from '../../../api/plans';
import { planKeys } from '../../../api/queryKeys';
import type { Page, PlanSummary, Plan } from '../../../api/types';

export function usePlans(params: ListPlansParams = {}, enabled = true) {
  return useQuery<Page<PlanSummary>>({
    queryKey: planKeys.list(params),
    queryFn: () => listPlans(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePlanDetail(id: number) {
  return useQuery<Plan>({
    queryKey: planKeys.detail(id),
    queryFn: () => getPlan(id),
    enabled: !!id,
  });
}
