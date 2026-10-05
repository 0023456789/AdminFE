import client from './client';
import type { Plan, PlanSummary, PlanCreateRequest, PlanUpdateRequest, Page } from './types';

export interface ListPlansParams {
  keyword?: string;
  isActive?: boolean;
  durationMonths?: 1 | 6 | 12;
  page?: number;
  size?: number;
  sort?: string;
}

export async function listPlans(params: ListPlansParams = {}): Promise<Page<PlanSummary>> {
  return client.get('/plans', { params }) as Promise<Page<PlanSummary>>;
}

export async function getPlan(id: number): Promise<Plan> {
  return client.get(`/plans/${id}`) as Promise<Plan>;
}

export async function createPlan(body: PlanCreateRequest): Promise<Plan> {
  return client.post('/plans', body) as Promise<Plan>;
}

export async function updatePlan(id: number, body: PlanUpdateRequest): Promise<Plan> {
  return client.put(`/plans/${id}`, body) as Promise<Plan>;
}

export async function setPlanStatus(id: number, isActive: boolean): Promise<Plan> {
  return client.patch(`/plans/${id}/status`, { isActive }) as Promise<Plan>;
}

export async function deletePlan(id: number): Promise<string> {
  return client.delete(`/plans/${id}`) as Promise<string>;
}
