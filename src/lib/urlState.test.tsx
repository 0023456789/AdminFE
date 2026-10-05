import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { usePlanUrlState } from './urlState';

function createWrapper(initialEntries: string[] = ['/plans']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('usePlanUrlState', () => {
  it('initializes with default values when query string is empty', () => {
    const { result } = renderHook(() => usePlanUrlState(), {
      wrapper: createWrapper(['/plans']),
    });

    expect(result.current.raw.keyword).toBe('');
    expect(result.current.raw.isActive).toBeUndefined();
    expect(result.current.raw.durationMonths).toBeUndefined();
    expect(result.current.raw.page).toBe(0);
    expect(result.current.raw.size).toBe(20);
    expect(result.current.raw.sort).toBe('createdAt,desc');
    expect(result.current.isFiltered).toBe(false);

    expect(result.current.params).toEqual({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
    });
  });

  it('correctly parses custom query parameters from URL', () => {
    const { result } = renderHook(() => usePlanUrlState(), {
      wrapper: createWrapper(['/plans?q=DEMO&active=true&dur=6&page=2&size=50&sort=price,asc']),
    });

    expect(result.current.raw.keyword).toBe('DEMO');
    expect(result.current.raw.isActive).toBe(true);
    expect(result.current.raw.durationMonths).toBe(6);
    expect(result.current.raw.page).toBe(2);
    expect(result.current.raw.size).toBe(50);
    expect(result.current.raw.sort).toBe('price,asc');
    expect(result.current.isFiltered).toBe(true);

    expect(result.current.params).toEqual({
      keyword: 'DEMO',
      isActive: true,
      durationMonths: 6,
      page: 2,
      size: 50,
      sort: 'price,asc',
    });
  });

  it('falls back to default sort when given an disallowed sort parameter', () => {
    const { result } = renderHook(() => usePlanUrlState(), {
      wrapper: createWrapper(['/plans?sort=hack_column,desc']),
    });

    expect(result.current.raw.sort).toBe('createdAt,desc');
  });

  it('resets page to 0 when keyword changes', () => {
    const { result } = renderHook(() => usePlanUrlState(), {
      wrapper: createWrapper(['/plans?page=3']),
    });

    expect(result.current.raw.page).toBe(3);

    act(() => {
      result.current.setKeyword('NEW_PLAN');
    });

    expect(result.current.raw.keyword).toBe('NEW_PLAN');
    expect(result.current.raw.page).toBe(0);
  });

  it('clears all filters when resetFilters is called', () => {
    const { result } = renderHook(() => usePlanUrlState(), {
      wrapper: createWrapper(['/plans?q=DEMO&active=false&dur=12&page=2']),
    });

    expect(result.current.isFiltered).toBe(true);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.raw.keyword).toBe('');
    expect(result.current.raw.isActive).toBeUndefined();
    expect(result.current.raw.durationMonths).toBeUndefined();
    expect(result.current.raw.page).toBe(0);
    expect(result.current.isFiltered).toBe(false);
  });
});
