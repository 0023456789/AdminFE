import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListPlansParams } from '../api/plans';

export const ALLOWED_SORTS = [
  'createdAt,asc',
  'createdAt,desc',
  'name,asc',
  'name,desc',
  'code,asc',
  'code,desc',
  'price,asc',
  'price,desc',
  'durationMonths,asc',
  'durationMonths,desc',
] as const;

export type AllowedSort = (typeof ALLOWED_SORTS)[number];

export const DEFAULT_SORT: AllowedSort = 'createdAt,desc';
export const DEFAULT_PAGE = 0;
export const DEFAULT_PAGE_SIZE = 20;

export interface PlanUrlState {
  params: ListPlansParams;
  raw: {
    keyword: string;
    isActive: boolean | undefined;
    durationMonths: 1 | 6 | 12 | undefined;
    page: number;
    size: number;
    sort: string;
  };
  isFiltered: boolean;
  setKeyword: (q: string) => void;
  setIsActive: (active: boolean | undefined) => void;
  setDuration: (dur: 1 | 6 | 12 | undefined) => void;
  setPagination: (page: number, size: number) => void;
  setSort: (sort: string | undefined) => void;
  setTableState: (page: number, size: number, sort: string | undefined) => void;
  resetFilters: () => void;
}

export function usePlanUrlState(): PlanUrlState {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse keyword
  const keyword = searchParams.get('q')?.trim() ?? '';

  // Parse isActive
  const activeParam = searchParams.get('active');
  const isActive =
    activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

  // Parse durationMonths
  const durParam = searchParams.get('dur');
  const durationMonths =
    durParam === '1'
      ? (1 as const)
      : durParam === '6'
        ? (6 as const)
        : durParam === '12'
          ? (12 as const)
          : undefined;

  // Parse page (0-based)
  const pageParam = parseInt(searchParams.get('page') ?? '', 10);
  const page = !isNaN(pageParam) && pageParam >= 0 ? pageParam : DEFAULT_PAGE;

  // Parse size
  const sizeParam = parseInt(searchParams.get('size') ?? '', 10);
  const size =
    !isNaN(sizeParam) && [10, 20, 50, 100].includes(sizeParam)
      ? sizeParam
      : DEFAULT_PAGE_SIZE;

  // Parse sort
  const sortParam = searchParams.get('sort');
  const sort = (ALLOWED_SORTS as readonly string[]).includes(sortParam ?? '')
    ? (sortParam as AllowedSort)
    : DEFAULT_SORT;

  // Check if non-default filters are active
  const isFiltered = Boolean(keyword || isActive !== undefined || durationMonths !== undefined);

  // Compute ListPlansParams for the API
  const params: ListPlansParams = useMemo(() => {
    const p: ListPlansParams = {
      page,
      size,
      sort,
    };
    if (keyword) p.keyword = keyword;
    if (isActive !== undefined) p.isActive = isActive;
    if (durationMonths !== undefined) p.durationMonths = durationMonths;
    return p;
  }, [keyword, isActive, durationMonths, page, size, sort]);

  const updateParams = useCallback(
    (updater: (prev: URLSearchParams) => URLSearchParams) => {
      setSearchParams(updater, { replace: true });
    },
    [setSearchParams],
  );

  const setKeyword = useCallback(
    (q: string) => {
      updateParams((prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = q.trim();
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
        next.set('page', '0');
        return next;
      });
    },
    [updateParams],
  );

  const setIsActive = useCallback(
    (active: boolean | undefined) => {
      updateParams((prev) => {
        const next = new URLSearchParams(prev);
        if (active === true) {
          next.set('active', 'true');
        } else if (active === false) {
          next.set('active', 'false');
        } else {
          next.delete('active');
        }
        next.set('page', '0');
        return next;
      });
    },
    [updateParams],
  );

  const setDuration = useCallback(
    (dur: 1 | 6 | 12 | undefined) => {
      updateParams((prev) => {
        const next = new URLSearchParams(prev);
        if (dur !== undefined) {
          next.set('dur', String(dur));
        } else {
          next.delete('dur');
        }
        next.set('page', '0');
        return next;
      });
    },
    [updateParams],
  );

  const setPagination = useCallback(
    (newPage: number, newSize: number) => {
      updateParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        next.set('size', String(newSize));
        return next;
      });
    },
    [updateParams],
  );

  const setSort = useCallback(
    (newSort: string | undefined) => {
      updateParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newSort && (ALLOWED_SORTS as readonly string[]).includes(newSort)) {
          next.set('sort', newSort);
        } else {
          next.set('sort', DEFAULT_SORT);
        }
        return next;
      });
    },
    [updateParams],
  );

  const setTableState = useCallback(
    (newPage: number, newSize: number, newSort: string | undefined) => {
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
    },
    [updateParams],
  );

  const resetFilters = useCallback(() => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('active');
      next.delete('dur');
      next.set('page', '0');
      return next;
    });
  }, [updateParams]);

  return {
    params,
    raw: {
      keyword,
      isActive,
      durationMonths,
      page,
      size,
      sort,
    },
    isFiltered,
    setKeyword,
    setIsActive,
    setDuration,
    setPagination,
    setSort,
    setTableState,
    resetFilters,
  };
}
