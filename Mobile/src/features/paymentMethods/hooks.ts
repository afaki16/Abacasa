// PaymentMethods modülü sorguları ve mutation'ları (PaymentMethodsController).
// Yetkiler: PaymentMethods.Read / Create / Update / Delete.

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { paymentMethodsApi } from './api';
import type {
  CreatePaymentMethodRequest,
  PaymentMethod,
  PaymentMethodDetail,
  PaymentMethodListParams,
  UpdatePaymentMethodRequest,
} from './types';

export const paymentMethodKeys = {
  all: ['paymentMethods'] as const,
  lists: () => [...paymentMethodKeys.all, 'list'] as const,
  list: (params: PaymentMethodListParams) => [...paymentMethodKeys.lists(), params] as const,
  /** Seçiciler için tüm ödeme araçları. */
  options: () => [...paymentMethodKeys.all, 'options'] as const,
  details: () => [...paymentMethodKeys.all, 'detail'] as const,
  detail: (id: number) => [...paymentMethodKeys.details(), id] as const,
};

/**
 * Güncellemede ad, tür (yemek kartı toplamlara girmez) ve kesim günü değişebilir. Etkilenenler:
 * harcama satırları ve özeti (['expenses']), dönem özeti ve kart dönemi (['dashboard']),
 * sabit ödeme ve bağış satırları (['recurringPayments'], ['donations']), yıllık tablo gider tarafı (['ledger']).
 */
const UPDATE_AFFECTED_ROOTS = [['expenses'], ['dashboard'], ['recurringPayments'], ['donations'], ['ledger']] as const;

function invalidateOwn(queryClient: QueryClient) {
  // lists + options + details: seçicilerdeki liste de güncel kalsın.
  return queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
}

export function usePaymentMethodsInfinite(params: PaymentMethodListParams) {
  return useInfiniteQuery<PagedResult<PaymentMethod>, ApiError>({
    queryKey: paymentMethodKeys.list(params),
    queryFn: ({ pageParam }) => paymentMethodsApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

/** Ödeme aracı seçicileri ve kart dönemi seçimi (pasifler dahil). */
export function usePaymentMethodOptions() {
  return useQuery<PaymentMethod[], ApiError>({
    queryKey: paymentMethodKeys.options(),
    queryFn: paymentMethodsApi.options,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentMethod(id: number) {
  const queryClient = useQueryClient();
  return useQuery<PaymentMethodDetail, ApiError>({
    queryKey: paymentMethodKeys.detail(id),
    queryFn: () => paymentMethodsApi.get(id),
    enabled: Number.isFinite(id),
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<PaymentMethod>[] }>({ queryKey: paymentMethodKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((m) => m.id === id),
  });
}

/** Yeni araç dönem özetinin ödeme aracı kırılımına girebilir; ['dashboard'] tazelenir. */
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation<PaymentMethod, ApiError, CreatePaymentMethodRequest>({
    mutationFn: paymentMethodsApi.create,
    onSuccess: () =>
      Promise.all([invalidateOwn(queryClient), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]),
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation<PaymentMethod, ApiError, UpdatePaymentMethodRequest>({
    mutationFn: paymentMethodsApi.update,
    onSuccess: () =>
      Promise.all([
        invalidateOwn(queryClient),
        ...UPDATE_AFFECTED_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]),
  });
}

/** Kullanımdaki araç silinemez (409); pasif yapmak için useUpdatePaymentMethod kullanılır. */
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await paymentMethodsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: paymentMethodKeys.detail(id) });
      return Promise.all([invalidateOwn(queryClient), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]);
    },
  });
}
