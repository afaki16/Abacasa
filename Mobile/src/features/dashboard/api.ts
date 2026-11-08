// Dashboard uçları (DashboardController). Yetki: Dashboard.Read.
// Tek uç: dönem özeti + kırılımlar + borç özeti + yaklaşan ödemeler (upcoming).

import { apiGet } from '@/lib/api';

import type { Dashboard, DashboardParams } from './types';

export const DASHBOARD_ENDPOINTS = {
  GET: '/api/Dashboard',
} as const;

export const dashboardApi = {
  get({ period, today }: DashboardParams): Promise<Dashboard> {
    return apiGet<Dashboard>(DASHBOARD_ENDPOINTS.GET, { startDate: period.start, endDate: period.end, today });
  },
};
