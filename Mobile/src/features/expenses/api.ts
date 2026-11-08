// Expenses uçları (ExpensesController). Yetkiler: Expenses.Read / Create / Update / Delete.
// Özet (summary) de Expenses.Read ister ve listeyle aynı süzgeçleri alır.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import { toExpenseQueryParams } from './params';
import type {
  CreateExpenseRequest,
  Expense,
  ExpenseDetail,
  ExpenseFilters,
  ExpenseSummary,
  UpdateExpenseRequest,
} from './types';

export const EXPENSES_ENDPOINTS = {
  LIST: '/api/Expenses',
  SUMMARY: '/api/Expenses/summary',
  DETAIL: (id: number) => `/api/Expenses/${id}`,
} as const;

export const expensesApi = {
  /** Tarihe göre yeniden eskiye, sayfalı. */
  list(page: number, filters: ExpenseFilters = {}): Promise<PagedResult<Expense>> {
    return apiGet<PagedResult<Expense>>(EXPENSES_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      ...toExpenseQueryParams(filters),
    });
  },

  /** Aynı süzgeçlerle toplamlar (yemek kartı ayrı). */
  summary(filters: ExpenseFilters = {}): Promise<ExpenseSummary> {
    return apiGet<ExpenseSummary>(EXPENSES_ENDPOINTS.SUMMARY, toExpenseQueryParams(filters));
  },

  get(id: number): Promise<ExpenseDetail> {
    return apiGet<ExpenseDetail>(EXPENSES_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateExpenseRequest): Promise<Expense> {
    return apiPost<Expense>(EXPENSES_ENDPOINTS.LIST, request);
  },

  update(request: UpdateExpenseRequest): Promise<Expense> {
    return apiPut<Expense>(EXPENSES_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', EXPENSES_ENDPOINTS.DETAIL(id));
  },
};
