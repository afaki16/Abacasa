// Dashboard (Özet) sorguları (DashboardController). Yetki: Dashboard.Read.
// Salt okunur; harcama, bağış, sabit ödeme, borç, kur, araç vb. mutation'lar ['dashboard'] kökünü geçersiz kılar.

import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api';
import { todayIso } from '@/lib/format/period';

import { dashboardApi } from './api';
import type { Dashboard, DashboardParams } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summaries: () => [...dashboardKeys.all, 'summary'] as const,
  summary: ({ period, today }: DashboardParams) =>
    [...dashboardKeys.summaries(), { start: period.start, end: period.end, today }] as const,
};

/** Dönem özeti. `today` verilmezse cihazın bugünü kullanılır. */
export function useDashboard(period: DashboardParams['period'], today: string = todayIso()) {
  const params: DashboardParams = { period, today };
  return useQuery<Dashboard, ApiError>({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => dashboardApi.get(params),
  });
}

/** Yalnızca yaklaşan ödemeler/hatırlatmalar (aynı sorgu, ek istek yok). */
export function useDashboardUpcoming(period: DashboardParams['period'], today: string = todayIso()) {
  const params: DashboardParams = { period, today };
  return useQuery<Dashboard, ApiError, Dashboard['upcoming']>({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => dashboardApi.get(params),
    select: (data) => data.upcoming,
  });
}
