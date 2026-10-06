import type { 
  Plan, 
  PlanCreateRequest, 
  PlanUpdateRequest,
  BonusRequest,
  AppQuotaRequest
} from '../../../api/types';

export interface PlanFormValues {
  code: string;
  name: string;
  description?: string;
  price: number;
  durationMonths: 1 | 6 | 12;
  quotaType: 'DAILY' | 'PER_CYCLE' | 'MONTHLY';
  dataQuotaMb: number;
  cycleDays?: number;
  voiceMinutes?: number;
  cutoffPolicy: 'DISCONNECT' | 'THROTTLE';
  throttleSpeedKbps?: number;
  isActive: boolean; // only for create, but we keep it here

  bonuses: BonusRequest[];
  appQuotas: AppQuotaRequest[];
}

export const toFormValues = (plan: Plan): PlanFormValues => {
  return {
    code: plan.code ?? '',
    name: plan.name ?? '',
    description: plan.description ?? undefined,
    price: plan.price ?? 0,
    durationMonths: (plan.durationMonths as 1 | 6 | 12) ?? 1,
    quotaType: plan.quotaType ?? 'DAILY',
    dataQuotaMb: plan.dataQuotaMb ?? 0,
    cycleDays: plan.cycleDays ?? undefined,
    voiceMinutes: plan.voiceMinutes ?? 0,
    cutoffPolicy: plan.cutoffPolicy ?? 'DISCONNECT',
    throttleSpeedKbps: plan.throttleSpeedKbps ?? undefined,
    isActive: plan.isActive ?? true,
    
    // Map existing bonuses to form fields
    bonuses: (plan.bonuses ?? []).map(b => ({
      bonusType: b.bonusType as 'DATA_MB' | 'VOICE_MIN',
      amount: b.amount ?? 0,
    })),
    
    // Map existing app quotas to form fields
    appQuotas: (plan.appQuotas ?? []).map(a => ({
      appId: a.appId ?? 0,
      quotaType: (a.quotaType as 'DAILY' | 'PER_CYCLE' | 'MONTHLY') ?? 'DAILY',
      quotaMb: a.quotaMb ?? 0,
    })),
  };
};

export const toPayload = (
  values: PlanFormValues,
  isEdit: boolean
): PlanCreateRequest | PlanUpdateRequest => {
  const base = {
    code: values.code.trim(),
    name: values.name.trim(),
    description: values.description?.trim() || null,
    price: values.price,
    durationMonths: values.durationMonths,
    quotaType: values.quotaType,
    dataQuotaMb: values.dataQuotaMb,
    cycleDays: values.quotaType === 'PER_CYCLE' ? (values.cycleDays ?? null) : null,
    voiceMinutes: values.voiceMinutes ?? 0,
    cutoffPolicy: values.cutoffPolicy,
    throttleSpeedKbps: values.cutoffPolicy === 'THROTTLE' ? (values.throttleSpeedKbps ?? null) : null,
    firstCycleBonuses: values.bonuses || [],
    appQuotas: values.appQuotas || [],
  };

  if (isEdit) {
    return base as PlanUpdateRequest;
  }

  return {
    ...base,
    isActive: values.isActive,
  } as PlanCreateRequest;
};
