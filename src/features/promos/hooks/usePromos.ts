import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  listPromos, 
  getPromo, 
  createPromo, 
  updatePromo, 
  setPromoStatus, 
  deletePromo,
  validatePromo,
  type ListPromosParams 
} from '../../../api/promos';
import { promoKeys } from '../../../api/queryKeys';
import type { Page, Promo, PromoCreateRequest, PromoUpdateRequest, PromoValidateRequest, PromoValidation } from '../../../api/types';
import { message } from 'antd';
import { vi } from '../../../i18n/vi';

export function usePromos(params: ListPromosParams = {}) {
  return useQuery<Page<Promo>>({
    queryKey: promoKeys.list(params),
    queryFn: () => listPromos(params),
    placeholderData: keepPreviousData,
  });
}

export function usePromoDetail(id: number) {
  return useQuery<Promo>({
    queryKey: promoKeys.detail(id),
    queryFn: () => getPromo(id),
    enabled: !!id,
  });
}

export function useCreatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PromoCreateRequest) => createPromo(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoKeys.all });
    },
  });
}

export function useUpdatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: PromoUpdateRequest }) => updatePromo(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: promoKeys.all });
      queryClient.invalidateQueries({ queryKey: promoKeys.detail(id) });
    },
  });
}

export function useTogglePromoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive, code }: { id: number; isActive: boolean; code: string }) => 
      setPromoStatus(id, isActive),
    onSuccess: (_, { id, isActive, code }) => {
      message.success(vi.promos.toggleSuccess(code, isActive));
      queryClient.invalidateQueries({ queryKey: promoKeys.all });
      queryClient.invalidateQueries({ queryKey: promoKeys.detail(id) });
    },
  });
}

export function useDeletePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; code: string }) => deletePromo(id),
    onSuccess: (_, { code }) => {
      message.success(vi.promos.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: promoKeys.all });
    },
  });
}

export function useValidatePromo() {
  return useMutation({
    mutationFn: (body: PromoValidateRequest) => validatePromo(body),
  });
}
