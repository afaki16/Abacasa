// Budgets uçları (BudgetsController). Yetkiler: Budgets.Read / Create / Update / Delete.

import { apiGet, apiPost, apiPut, apiSend, type PagedResult } from '@/lib/api';
import { todayIso } from '@/lib/format/period';

import type { Budget, BudgetReport, CreateBudgetRequest, UpdateBudgetRequest } from './types';

/** Bütün kayıtlar tek sayfada (backend üst sınırı 1000). */
const PAGE_SIZE = 1000;

export const BUDGETS_ENDPOINTS = {
  LIST: '/api/Budgets',
  DETAIL: (id: number) => `/api/Budgets/${id}`,
  REPORT: (year: number, month: number) => `/api/Budgets/month/${year}/${month}`,
} as const;

export const budgetsApi = {
  /** Hane önce, sonra kişi adı; her sahipte en yeni başlangıç önce. */
  async list(): Promise<Budget[]> {
    const result = await apiGet<PagedResult<Budget>>(BUDGETS_ENDPOINTS.LIST, { page: 1, pageSize: PAGE_SIZE });
    return result.items;
  },

  get(id: number): Promise<Budget> {
    return apiGet<Budget>(BUDGETS_ENDPOINTS.DETAIL(id));
  },

  /** Ayın raporu; kalan gün ve günlük limit cihazın bugününe göre. */
  report(year: number, month: number, today: string = todayIso()): Promise<BudgetReport> {
    return apiGet<BudgetReport>(BUDGETS_ENDPOINTS.REPORT(year, month), { today });
  },

  create(request: CreateBudgetRequest): Promise<Budget> {
    return apiPost<Budget>(BUDGETS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateBudgetRequest): Promise<Budget> {
    return apiPut<Budget>(BUDGETS_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', BUDGETS_ENDPOINTS.DETAIL(id));
  },
};
