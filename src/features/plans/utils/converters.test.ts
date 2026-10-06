import { describe, it, expect } from 'vitest';
import { toFormValues, toPayload, type PlanFormValues } from './converters';
import type { Plan } from '../../../api/types';

describe('Plan Form Converters', () => {
  const mockPlan: Plan = {
    id: 1,
    code: 'PLAN123',
    name: 'Gói 123',
    price: 100000,
    durationMonths: 1,
    quotaType: 'PER_CYCLE',
    dataQuotaMb: 5000,
    cycleDays: 30,
    cutoffPolicy: 'THROTTLE',
    throttleSpeedKbps: 256,
    isActive: true,
    bonuses: [{ bonusType: 'DATA_MB', amount: 1024 }],
    appQuotas: [{ appId: 1, quotaType: 'DAILY', quotaMb: 500, appCode: 'APP1', appName: 'App 1' }],
  };

  it('toFormValues converts Plan to PlanFormValues correctly', () => {
    const formValues = toFormValues(mockPlan);

    expect(formValues.code).toBe('PLAN123');
    expect(formValues.cycleDays).toBe(30);
    expect(formValues.bonuses).toEqual([{ bonusType: 'DATA_MB', amount: 1024 }]);
    expect(formValues.appQuotas).toEqual([
      { appId: 1, quotaType: 'DAILY', quotaMb: 500 } // only appId, quotaType, quotaMb because we stripped others
    ]);
  });

  it('toPayload converts correctly in Create mode', () => {
    const values: PlanFormValues = {
      code: 'NEW_PLAN',
      name: 'New Plan',
      price: 50000,
      durationMonths: 6,
      quotaType: 'DAILY',
      dataQuotaMb: 2000,
      cutoffPolicy: 'DISCONNECT',
      isActive: false,
      bonuses: [],
      appQuotas: [],
    };

    const payload = toPayload(values, false);

    expect(payload.code).toBe('NEW_PLAN');
    expect(payload.cycleDays).toBeNull(); 
    expect(payload.throttleSpeedKbps).toBeNull(); 
    expect((payload as any).isActive).toBe(false); 
    expect(payload.firstCycleBonuses).toEqual([]);
    expect(payload.appQuotas).toEqual([]);
  });

  it('toPayload converts correctly in Edit mode and maps nested arrays', () => {
    const formValues = toFormValues(mockPlan);
    
    formValues.name = 'Updated Plan';
    formValues.quotaType = 'MONTHLY'; 
    
    const payload = toPayload(formValues, true); 

    expect(payload.name).toBe('Updated Plan');
    expect(payload.cycleDays).toBeNull();
    expect((payload as any).isActive).toBeUndefined(); 

    expect(payload.firstCycleBonuses).toEqual([{ bonusType: 'DATA_MB', amount: 1024 }]);
    expect(payload.appQuotas).toEqual([{ appId: 1, quotaType: 'DAILY', quotaMb: 500 }]);
  });
});
