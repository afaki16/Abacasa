// Debts modülü sorguları ve mutation'ları (borçlar, özet, borç ödemeleri).

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { debtsApi } from './api';
import type {
  CreateDebtPaymentVariables,
  CreateDebtRequest,
  DebtDetail,
  DebtListItem,
  DebtListParams,
  DebtPayment,
  DebtSummary,
  DeleteDebtPaymentVariables,
  UpdateDebtPaymentVariables,
  UpdateDebtRequest,
} from './types';

export const debtKeys = {
  all: ['debts'] as const,
  lists: () => [...debtKeys.all, 'list'] as const,
  list: (params: DebtListParams) => [...debtKeys.lists(), params] as const,
  summary: () => [...debtKeys.all, 'summary'] as const,
  details: () => [...debtKeys.all, 'detail'] as const,
  detail: (id: number) => [...debtKeys.details(), id] as const,
  payments: (debtId: number) => [...debtKeys.all, 'payments', debtId] as const,
};

/**
 * Borç ve ödeme değişince modülün tamamı (liste/detaydaki ödenen-kalan, özet, ödemeler) ve Özet tazelenir.
 * Borç hareketleri dönem toplamına girmez ama Özet sayfası açık borcu gösterir.
 */
function invalidateDebts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: debtKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

export function useDebtsInfinite(params: DebtListParams) {
  return useInfiniteQuery<PagedResult<DebtListItem>, ApiError>({
    queryKey: debtKeys.list(params),
    queryFn: ({ pageParam }) => debtsApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

export function useDebtSummary() {
  return useQuery<DebtSummary, ApiError>({
    queryKey: debtKeys.summary(),
    queryFn: debtsApi.summary,
  });
}

export function useDebt(id: number) {
  const queryClient = useQueryClient();
  return useQuery<DebtDetail, ApiError>({
    queryKey: debtKeys.detail(id),
    queryFn: () => debtsApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<DebtListItem>[] }>({ queryKey: debtKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((d) => d.id === id),
  });
}

export function useDebtPayments(debtId: number) {
  return useQuery<DebtPayment[], ApiError>({
    queryKey: debtKeys.payments(debtId),
    queryFn: () => debtsApi.payments(debtId),
    enabled: Number.isFinite(debtId),
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation<DebtListItem, ApiError, CreateDebtRequest>({
    mutationFn: debtsApi.create,
    onSuccess: () => invalidateDebts(queryClient),
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  return useMutation<DebtListItem, ApiError, UpdateDebtRequest>({
    mutationFn: debtsApi.update,
    onSuccess: () => invalidateDebts(queryClient),
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await debtsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: debtKeys.detail(id) });
      queryClient.removeQueries({ queryKey: debtKeys.payments(id) });
      return invalidateDebts(queryClient);
    },
  });
}

export function useCreateDebtPayment() {
  const queryClient = useQueryClient();
  return useMutation<DebtPayment, ApiError, CreateDebtPaymentVariables>({
    mutationFn: ({ debtId, ...request }) => debtsApi.createPayment(debtId, request),
    onSuccess: () => invalidateDebts(queryClient),
  });
}

export function useUpdateDebtPayment() {
  const queryClient = useQueryClient();
  return useMutation<DebtPayment, ApiError, UpdateDebtPaymentVariables>({
    mutationFn: ({ debtId, paymentId, ...request }) => debtsApi.updatePayment(debtId, paymentId, request),
    onSuccess: () => invalidateDebts(queryClient),
  });
}

export function useDeleteDebtPayment() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, DeleteDebtPaymentVariables>({
    mutationFn: async ({ debtId, paymentId }) => {
      await debtsApi.removePayment(debtId, paymentId);
    },
    onSuccess: () => invalidateDebts(queryClient),
  });
}
