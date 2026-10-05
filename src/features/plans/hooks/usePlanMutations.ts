import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { setPlanStatus, deletePlan } from '../../../api/plans';
import { planKeys } from '../../../api/queryKeys';
import type { Page, PlanSummary, Plan } from '../../../api/types';
import { getErrorMessage } from '../../../lib/errors';
import { vi } from '../../../i18n/vi';

export interface ToggleStatusVariables {
  id: number;
  isActive: boolean;
  name?: string;
}

export function useTogglePlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: ToggleStatusVariables) => setPlanStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      // 1. Cancel ongoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: planKeys.lists() });

      // 2. Snapshot previous cache data for rollback
      const previousLists = queryClient.getQueriesData<Page<PlanSummary>>({
        queryKey: planKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<Plan>(planKeys.detail(id));

      // 3. Optimistically update all plan lists in cache
      queryClient.setQueriesData<Page<PlanSummary>>(
        { queryKey: planKeys.lists() },
        (old) => {
          if (!old?.content) return old;
          return {
            ...old,
            content: old.content.map((item) =>
              item.id === id ? { ...item, isActive } : item,
            ),
          };
        },
      );

      // Also update detail cache if it exists
      if (previousDetail) {
        queryClient.setQueryData<Plan>(planKeys.detail(id), {
          ...previousDetail,
          isActive,
        });
      }

      return { previousLists, previousDetail };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(planKeys.detail(variables.id), context.previousDetail);
      }
      message.error(getErrorMessage(err));
    },
    onSuccess: (data, variables) => {
      message.success(vi.plans.toggleSuccess(variables.name ?? data.name ?? '', variables.isActive));
    },
    onSettled: () => {
      // Always refetch to stay in sync
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; name?: string }) => deletePlan(id),
    onSuccess: () => {
      message.success(vi.plans.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
