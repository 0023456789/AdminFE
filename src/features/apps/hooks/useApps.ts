import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import {
  listApps,
  createApp,
  updateApp,
  setAppStatus,
  deleteApp,
  type ListAppsParams,
} from '../../../api/apps';
import { appKeys } from '../../../api/queryKeys';
import type { Page, App, AppCreateRequest, AppUpdateRequest } from '../../../api/types';
import { getErrorMessage } from '../../../lib/errors';
import { vi } from '../../../i18n/vi';

// --- URL STATE HOOK ---
export const ALLOWED_SORTS = [
  'createdAt,asc',
  'createdAt,desc',
  'name,asc',
  'name,desc',
  'code,asc',
  'code,desc',
] as const;
export type AllowedSort = (typeof ALLOWED_SORTS)[number];

const DEFAULT_SORT: AllowedSort = 'createdAt,desc';
const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;

export function useAppUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('q')?.trim() ?? '';
  const activeParam = searchParams.get('active');
  const isActive = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

  const pageParam = parseInt(searchParams.get('page') ?? '', 10);
  const page = !isNaN(pageParam) && pageParam >= 0 ? pageParam : DEFAULT_PAGE;

  const sizeParam = parseInt(searchParams.get('size') ?? '', 10);
  const size = !isNaN(sizeParam) && [10, 20, 50, 100].includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE;

  const sortParam = searchParams.get('sort');
  const sort = (ALLOWED_SORTS as readonly string[]).includes(sortParam ?? '') ? (sortParam as AllowedSort) : DEFAULT_SORT;

  const isFiltered = Boolean(keyword || isActive !== undefined);

  const params: ListAppsParams = useMemo(() => {
    const p: ListAppsParams = { page, size, sort };
    if (keyword) p.keyword = keyword;
    if (isActive !== undefined) p.isActive = isActive;
    return p;
  }, [keyword, isActive, page, size, sort]);

  const updateParams = useCallback((updater: (prev: URLSearchParams) => URLSearchParams) => {
    setSearchParams(updater, { replace: true });
  }, [setSearchParams]);

  const setKeyword = useCallback((q: string) => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      const trimmed = q.trim();
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      next.set('page', '0');
      return next;
    });
  }, [updateParams]);

  const setIsActive = useCallback((active: boolean | undefined) => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      if (active === true) next.set('active', 'true');
      else if (active === false) next.set('active', 'false');
      else next.delete('active');
      next.set('page', '0');
      return next;
    });
  }, [updateParams]);

  const setPagination = useCallback((newPage: number, newSize: number) => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      next.set('size', String(newSize));
      return next;
    });
  }, [updateParams]);

  const setTableState = useCallback((newPage: number, newSize: number, newSort: string | undefined) => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      next.set('size', String(newSize));
      if (newSort && (ALLOWED_SORTS as readonly string[]).includes(newSort)) {
        next.set('sort', newSort);
      } else {
        next.set('sort', DEFAULT_SORT);
      }
      return next;
    });
  }, [updateParams]);

  const resetFilters = useCallback(() => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('active');
      next.set('page', '0');
      return next;
    });
  }, [updateParams]);

  return {
    params,
    raw: { keyword, isActive, page, size, sort },
    isFiltered,
    setKeyword,
    setIsActive,
    setPagination,
    setTableState,
    resetFilters,
  };
}


// --- QUERIES ---
export function useApps(params: ListAppsParams = {}) {
  return useQuery<Page<App>>({
    queryKey: appKeys.list(params),
    queryFn: () => listApps(params),
    placeholderData: keepPreviousData,
  });
}


// --- MUTATIONS ---
export function useCreateApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppCreateRequest) => createApp(data),
    onSuccess: () => {
      message.success(vi.apps.createSuccess);
      queryClient.invalidateQueries({ queryKey: appKeys.all });
    },
  });
}

export function useUpdateApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppUpdateRequest }) => updateApp(id, data),
    onSuccess: () => {
      message.success(vi.apps.updateSuccess);
      queryClient.invalidateQueries({ queryKey: appKeys.all });
    },
  });
}

export function useToggleAppStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean; name?: string }) => setAppStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: appKeys.lists() });
      const previousLists = queryClient.getQueriesData<Page<App>>({
        queryKey: appKeys.lists(),
      });

      queryClient.setQueriesData<Page<App>>(
        { queryKey: appKeys.lists() },
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

      return { previousLists };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error(getErrorMessage(err));
    },
    onSuccess: (data, variables) => {
      if (data.warnings?.includes('APP_STILL_ASSIGNED_TO_PLANS')) {
        message.warning('Ứng dụng đã tắt nhưng vẫn còn nằm trong cấu hình ưu đãi của các gói cước.');
        return;
      }
      message.success(vi.apps.toggleSuccess(variables.name ?? data.name ?? '', variables.isActive));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: appKeys.all });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; name?: string }) => deleteApp(id),
    onSuccess: () => {
      message.success(vi.apps.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: appKeys.all });
    },
  });
}
