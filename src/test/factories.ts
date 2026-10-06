import type { PlanSummary } from '../api/types';

let idCounter = 1;
export const resetIdCounter = () => { idCounter = 1; };

export const createMockPlanSummary = (overrides?: Partial<PlanSummary>): PlanSummary => ({
  id: idCounter++,
  code: `PLAN${idCounter}`,
  name: `Gói cước ${idCounter}`,
  price: 150000,
  durationMonths: 1,
  quotaType: 'PER_CYCLE',
  dataQuotaMb: 5120,
  cycleDays: 30,
  isActive: true,
  ...overrides,
});

export const createMockPlanSummaryList = (count: number): PlanSummary[] => {
  return Array.from({ length: count }, () => createMockPlanSummary());
};

import type { Plan } from '../api/types';

export const createMockPlan = (overrides?: Partial<Plan>): Plan => {
  const summary = createMockPlanSummary();
  return {
    ...summary,
    description: 'Mô tả gói cước chi tiết',
    cutoffPolicy: 'THROTTLE',
    voiceMinutes: 100,
    throttleSpeedKbps: 256,
    bonuses: [{ bonusType: 'DATA_MB', amount: 1024 }],
    appQuotas: [
      { appId: 1, appName: 'Zalo', appCode: 'ZALO', quotaType: 'DAILY', quotaMb: 500 },
      { appId: 2, appName: 'Youtube', appCode: 'YOUTUBE', quotaType: 'PER_CYCLE', quotaMb: 2048 }
    ],
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    ...overrides,
  };
};
