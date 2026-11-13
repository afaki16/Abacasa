// Budgets modülü sorguları ve mutation'ları (aylık harcama bütçesi ve ay raporu).
// Rapor harcama ve sabit ödemelere bağlıdır; anahtarı ['dashboard'] altında olduğundan Özet'i etkileyen her
// mutation (harcama, sabit ödeme, araç, kişi adı ...) raporu da tazeler. Kayıt listesi ['budgets'] altında.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api';

import { budgetsApi } from './api';
import type { Budget, BudgetReport, CreateBudgetRequest, UpdateBudgetRequest } from './types';

export const budgetKeys = {
  all: ['budgets'] as const,
  list: () => [...budgetKeys.all, 'list'] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: number) => [...budgetKeys.details(), id] as const,
  reports: () => ['dashboard', 'budget'] as const,
  report: (year: number, month: number, today: string) => [...budgetKeys.reports(), year, month, today] as const,
};

export function useBudgets() {
  return useQuery<Budget[], ApiError>({
    queryKey: budgetKeys.list(),
    queryFn: budgetsApi.list,
  });
}

export function useBudget(id: number) {
  const queryClient = useQueryClient();
  return useQuery<Budget, ApiError>({
    queryKey: budgetKeys.detail(id),
    queryFn: () => budgetsApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster.
    placeholderData: () => queryClient.getQueryData<Budget[]>(budgetKeys.list())?.find((b) => b.id === id),
  });
}

/** today ('YYYY-MM-DD') anahtarda; gün değişince kalan gün ve günlük limit yeniden hesaplanır. */
export function useBudgetReport(year: number, month: number, today: string, enabled = true) {
  return useQuery<BudgetReport, ApiError>({
    queryKey: budgetKeys.report(year, month, today),
    queryFn: () => budgetsApi.report(year, month, today),
    enabled,
  });
}

/** Bütçe değişikliği kayıt listesini ve ay raporlarını etkiler. */
function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
      queryClient.invalidateQueries({ queryKey: budgetKeys.reports() }),
    ]);
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation<Budget, ApiError, CreateBudgetRequest>({
    mutationFn: budgetsApi.create,
    onSuccess: invalidate,
  });
}

export function useUpdateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation<Budget, ApiError, UpdateBudgetRequest>({
    mutationFn: budgetsApi.update,
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBudgets();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await budgetsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: budgetKeys.detail(id) });
      return invalidate();
    },
  });
}
