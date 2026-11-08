// Expenses modülü sorguları ve mutation'ları (ExpensesController).
// Yetkiler: Expenses.Read / Create / Update / Delete.

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { expensesApi } from './api';
import type {
  CreateExpenseRequest,
  Expense,
  ExpenseDetail,
  ExpenseFilters,
  ExpenseSummary,
  UpdateExpenseRequest,
} from './types';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  summaries: () => [...expenseKeys.all, 'summary'] as const,
  summary: (filters: ExpenseFilters) => [...expenseKeys.summaries(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
};

/**
 * Bir harcama değişince etkilenen diğer önbellekler:
 * - ['dashboard']: dönem toplamı, ödeme aracı/kişi kırılımı;
 * - ['ledger']: yıllık tablonun gider tarafı (plan dışı harcamalar kayıt tarihine göre);
 * - ['recurringPayments']: harcama bir sabit ödeme vadesinin ödemesi olabilir (ödendi durumu
 *   bağlı canlı kayıttan hesaplanır); vade listesi ve "yaklaşan"lar değişir.
 */
const AFFECTED_ROOTS = [['dashboard'], ['ledger'], ['recurringPayments']] as const;

function invalidateAfterChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: expenseKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: expenseKeys.summaries() }),
    ...AFFECTED_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  ]);
}

/** Sonsuz kaydırmalı liste (tarihe göre yeniden eskiye). */
export function useExpensesInfinite(filters: ExpenseFilters) {
  return useInfiniteQuery<PagedResult<Expense>, ApiError>({
    queryKey: expenseKeys.list(filters),
    queryFn: ({ pageParam }) => expensesApi.list(pageParam as number, filters),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

/** Listeyle aynı süzgeçlerle dönem toplamları (yemek kartı ayrı). */
export function useExpenseSummary(filters: ExpenseFilters) {
  return useQuery<ExpenseSummary, ApiError>({
    queryKey: expenseKeys.summary(filters),
    queryFn: () => expensesApi.summary(filters),
  });
}

export function useExpense(id: number) {
  const queryClient = useQueryClient();
  return useQuery<ExpenseDetail, ApiError>({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<Expense>[] }>({ queryKey: expenseKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((e) => e.id === id),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation<Expense, ApiError, CreateExpenseRequest>({
    mutationFn: expensesApi.create,
    onSuccess: (expense) => {
      queryClient.setQueryData<ExpenseDetail>(expenseKeys.detail(expense.id), expense);
      return invalidateAfterChange(queryClient);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation<Expense, ApiError, UpdateExpenseRequest>({
    mutationFn: expensesApi.update,
    onSuccess: (expense) => {
      queryClient.setQueryData<ExpenseDetail>(expenseKeys.detail(expense.id), (old) => ({ ...old, ...expense }));
      return invalidateAfterChange(queryClient);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await expensesApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: expenseKeys.detail(id) });
      return invalidateAfterChange(queryClient);
    },
  });
}
