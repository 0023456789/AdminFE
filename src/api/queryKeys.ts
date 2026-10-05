import type { ListPlansParams } from './plans';
import type { ListAppsParams } from './apps';
import type { ListPromosParams } from './promos';

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (params: ListPlansParams) => [...planKeys.lists(), params] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: number) => [...planKeys.details(), id] as const,
};

export const appKeys = {
  all: ['apps'] as const,
  lists: () => [...appKeys.all, 'list'] as const,
  list: (params: ListAppsParams) => [...appKeys.lists(), params] as const,
  options: () => [...appKeys.all, 'options'] as const,
};

export const promoKeys = {
  all: ['promos'] as const,
  lists: () => [...promoKeys.all, 'list'] as const,
  list: (params: ListPromosParams) => [...promoKeys.lists(), params] as const,
  details: () => [...promoKeys.all, 'detail'] as const,
  detail: (id: number) => [...promoKeys.details(), id] as const,
};
