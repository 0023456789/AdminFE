import type { components } from './schema';

// === Enums ===
export type QuotaType = components['schemas']['QuotaType'];
export type CutoffPolicy = components['schemas']['CutoffPolicy'];
export type DiscountType = components['schemas']['DiscountType'];

// === Plan ===
export type PlanSummary = components['schemas']['PlanSummary'];
export type Plan = components['schemas']['Plan'];
export type PlanCreateRequest = components['schemas']['PlanCreateRequest'];
export type PlanUpdateRequest = components['schemas']['PlanUpdateRequest'];
export type BonusRequest = components['schemas']['BonusRequest'];
export type AppQuotaRequest = components['schemas']['AppQuotaRequest'];
export type Bonus = components['schemas']['Bonus'];
export type AppQuota = components['schemas']['AppQuota'];
export type StatusRequest = components['schemas']['StatusRequest'];

// === App ===
export type App = components['schemas']['App'] & {
  planCodes?: string[];
  warnings?: string[];
};
export type AppCreateRequest = components['schemas']['AppCreateRequest'];
export type AppUpdateRequest = components['schemas']['AppUpdateRequest'];

// === Promo ===
export type Promo = components['schemas']['Promo'];
export type PromoCreateRequest = components['schemas']['PromoCreateRequest'];
export type PromoUpdateRequest = components['schemas']['PromoUpdateRequest'];
export type PromoValidateRequest = components['schemas']['PromoValidateRequest'];
export type PromoValidation = components['schemas']['PromoValidation'] & { warnings?: string[] };

// === Pagination ===
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// === Errors ===
export type FieldError = components['schemas']['FieldError'];
