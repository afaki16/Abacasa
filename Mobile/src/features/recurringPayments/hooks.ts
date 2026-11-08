// RecurringPayments modülü sorguları ve mutation'ları (sabit ödeme planları ve dönem vadeleri).

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { recurringPaymentsApi } from './api';
import type {
  CreateRecurringPaymentRequest,
  LinkedRecord,
  LinkedRecordType,
  OccurrenceRange,
  PayRecurringPaymentResult,
  PayRecurringPaymentVariables,
  RecurringPaymentDetail,
  RecurringPaymentListItem,
  RecurringPaymentListParams,
  RecurringPaymentOccurrences,
  UpdateRecurringPaymentRequest,
} from './types';

export const recurringPaymentKeys = {
  all: ['recurringPayments'] as const,
  lists: () => [...recurringPaymentKeys.all, 'list'] as const,
  list: (params: RecurringPaymentListParams) => [...recurringPaymentKeys.lists(), params] as const,
  details: () => [...recurringPaymentKeys.all, 'detail'] as const,
  detail: (id: number) => [...recurringPaymentKeys.details(), id] as const,
  occurrencesAll: () => [...recurringPaymentKeys.all, 'occurrences'] as const,
  occurrences: (range: OccurrenceRange) => [...recurringPaymentKeys.occurrencesAll(), range.start, range.end] as const,
};

/**
 * Plan değişince: planlar ve vadeler; Özet (ödenmemiş vadeler dönem toplamına girer); Yıllık tablo
 * (plan satırları); bağış hedefi raporu (aktif bağış planlarının kalan vadeleri "planlanan"a girer).
 */
function invalidateAfterPlanChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: recurringPaymentKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['ledger'] }),
    queryClient.invalidateQueries({ queryKey: ['donationTargets'] }),
  ]);
}

/**
 * Ödeme/geri alma bağlı harcama ya da bağış kaydını oluşturur/siler: o modülün listeleri ve özetleri,
 * planın hasPayments alanı, Özet ve Yıllık tablo değişir. Bağışsa hedef raporundaki "verilen" de değişir.
 */
function invalidateAfterPaymentChange(queryClient: QueryClient, type: LinkedRecordType) {
  return Promise.all([
    invalidateAfterPlanChange(queryClient),
    queryClient.invalidateQueries({ queryKey: [type === 'donation' ? 'donations' : 'expenses'] }),
  ]);
}

/** Sonsuz kaydırmalı plan listesi. */
export function useRecurringPaymentsInfinite(params: RecurringPaymentListParams) {
  return useInfiniteQuery<PagedResult<RecurringPaymentListItem>, ApiError>({
    queryKey: recurringPaymentKeys.list(params),
    queryFn: ({ pageParam }) => recurringPaymentsApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

export function useRecurringPayment(id: number) {
  const queryClient = useQueryClient();
  return useQuery<RecurringPaymentDetail, ApiError>({
    queryKey: recurringPaymentKeys.detail(id),
    queryFn: () => recurringPaymentsApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<RecurringPaymentListItem>[] }>({ queryKey: recurringPaymentKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((p) => p.id === id),
  });
}

/** Dönemin vadeleri (Period'un start/end'i verilir). */
export function useRecurringPaymentOccurrences(range: OccurrenceRange) {
  return useQuery<RecurringPaymentOccurrences, ApiError>({
    queryKey: recurringPaymentKeys.occurrences(range),
    queryFn: () => recurringPaymentsApi.occurrences(range),
  });
}

export function useCreateRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation<RecurringPaymentListItem, ApiError, CreateRecurringPaymentRequest>({
    mutationFn: recurringPaymentsApi.create,
    onSuccess: () => invalidateAfterPlanChange(queryClient),
  });
}

export function useUpdateRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation<RecurringPaymentListItem, ApiError, UpdateRecurringPaymentRequest>({
    mutationFn: recurringPaymentsApi.update,
    onSuccess: () => invalidateAfterPlanChange(queryClient),
  });
}

export function useDeleteRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await recurringPaymentsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: recurringPaymentKeys.detail(id) });
      return invalidateAfterPlanChange(queryClient);
    },
  });
}

/** Vadeyi öder (RecurringPaymentPayments.Create). */
export function usePayRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation<PayRecurringPaymentResult, ApiError, PayRecurringPaymentVariables>({
    mutationFn: ({ recurringPaymentId, ...request }) => recurringPaymentsApi.pay(recurringPaymentId, request),
    onSuccess: (result) => invalidateAfterPaymentChange(queryClient, result.type),
  });
}

/** Ödemeyi geri alır; kayıt getLinkedRecord(occurrence) ile bulunur (izin: undoPermission). */
export function useUndoRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, LinkedRecord>({
    mutationFn: async (record) => {
      await recurringPaymentsApi.undo(record);
    },
    onSuccess: (_, record) => invalidateAfterPaymentChange(queryClient, record.type),
  });
}
