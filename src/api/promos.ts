import client from './client';
import type {
  Promo,
  PromoCreateRequest,
  PromoUpdateRequest,
  PromoValidateRequest,
  PromoValidation,
  Page,
} from './types';

export interface ListPromosParams {
  isActive?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function listPromos(params: ListPromosParams = {}): Promise<Page<Promo>> {
  return client.get('/promo-codes', { params }) as Promise<Page<Promo>>;
}

export async function getPromo(id: number): Promise<Promo> {
  return client.get(`/promo-codes/${id}`) as Promise<Promo>;
}

export async function createPromo(body: PromoCreateRequest): Promise<Promo> {
  return client.post('/promo-codes', body) as Promise<Promo>;
}

export async function updatePromo(id: number, body: PromoUpdateRequest): Promise<Promo> {
  return client.put(`/promo-codes/${id}`, body) as Promise<Promo>;
}

export async function setPromoStatus(id: number, isActive: boolean): Promise<Promo> {
  return client.patch(`/promo-codes/${id}/status`, { isActive }) as Promise<Promo>;
}

export async function deletePromo(id: number): Promise<string> {
  return client.delete(`/promo-codes/${id}`) as Promise<string>;
}

export async function validatePromo(body: PromoValidateRequest): Promise<PromoValidation> {
  return client.post('/promo-codes/validate', body) as Promise<PromoValidation>;
}
