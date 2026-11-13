// Bütçe route'ları (bkz. ledger/routes.ts: yazılı route tipleri üretilene kadar Href'e çevrim tek noktada).

import type { Href } from 'expo-router';

export const budgetRoutes = {
  index: '/budgets' as Href,
  /** Yeni kayıt seçili aydan başlar. */
  new: (year: number, month: number) => `/budgets/new?year=${year}&month=${month}` as Href,
  edit: (id: number) => `/budgets/${id}` as Href,
};
