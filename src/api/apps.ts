import client from './client';
import type { App, AppCreateRequest, AppUpdateRequest, Page } from './types';

export interface ListAppsParams {
  isActive?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export async function listApps(params: ListAppsParams = {}): Promise<Page<App>> {
  return client.get('/apps', { params }) as Promise<Page<App>>;
}

export async function createApp(body: AppCreateRequest): Promise<App> {
  return client.post('/apps', body) as Promise<App>;
}

export async function updateApp(id: number, body: AppUpdateRequest): Promise<App> {
  return client.put(`/apps/${id}`, body) as Promise<App>;
}

export async function setAppStatus(id: number, isActive: boolean): Promise<App> {
  return client.patch(`/apps/${id}/status`, { isActive }) as Promise<App>;
}

export async function deleteApp(id: number): Promise<string> {
  return client.delete(`/apps/${id}`) as Promise<string>;
}
