import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListPromosParams } from '../../../api/promos';

const DEFAULT_SORT = 'createdAt,desc';
const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;

export function usePromoUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get('q')?.trim() ?? '';
  const activeParam = searchParams.get('active');
  const isActive = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;
  
  const pageParam = parseInt(searchParams.get('page') ?? '', 10);
  const page = !isNaN(pageParam) && pageParam >= 0 ? pageParam : DEFAULT_PAGE;

  const sizeParam = parseInt(searchParams.get('size') ?? '', 10);
  const size = !isNaN(sizeParam) && [10, 20, 50, 100].includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE;

  const sortParam = searchParams.get('sort');
  const sort = sortParam || DEFAULT_SORT;

  const isFiltered = Boolean(keyword || isActive !== undefined);

  const params: ListPromosParams = useMemo(() => {
    const p: ListPromosParams = { page, size, sort };
    if (keyword) p.keyword = keyword;
    if (isActive !== undefined) p.isActive = isActive;
    return p;
  }, [keyword, isActive, page, size, sort]);

  const updateParams = useCallback(
    (updater: (prev: URLSearchParams) => URLSearchParams) => {
      setSearchParams(updater, { replace: true });
    },
    [setSearchParams],
  );

  const setKeyword = useCallback((q: string) => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      if (q.trim()) next.set('q', q.trim());
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

  const setTableState = useCallback((newPage: number, newSize: number, newSort: string | undefined) => {
    updateParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      next.set('size', String(newSize));
      if (newSort) next.set('sort', newSort);
      else next.set('sort', DEFAULT_SORT);
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
    setTableState,
    resetFilters,
  };
}
