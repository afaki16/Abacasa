// ExchangeRates modülü sorguları ve mutation'ları (ExchangeRatesController).
// Yetkiler: ExchangeRates.Read / Create / Delete.

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api';

import { exchangeRatesApi } from './api';
import type { ExchangeRate, ExchangeRateListParams, SaveExchangeRateRequest } from './types';

export const exchangeRateKeys = {
  all: ['exchangeRates'] as const,
  lists: () => [...exchangeRateKeys.all, 'list'] as const,
  list: (params: ExchangeRateListParams) => [...exchangeRateKeys.lists(), params] as const,
};

/**
 * Elle girilen kur, TCMB kurundan yeniyse (ya da aynı gündeyse) güncel kur olur. Güncel kurla
 * hesaplanan TL karşılıkları: borç listesi ve özeti (['debts']), dönem özetindeki borç bölümü (['dashboard']).
 */
const AFFECTED_ROOTS = [['debts'], ['dashboard']] as const;

function invalidateAfterChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all }),
    ...AFFECTED_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  ]);
}

/** Son 20 kur (yeniden eskiye); birim verilirse yalnızca o birim. */
export function useExchangeRates(params: ExchangeRateListParams = {}) {
  return useQuery<ExchangeRate[], ApiError>({
    queryKey: exchangeRateKeys.list(params),
    queryFn: () => exchangeRatesApi.list(params),
  });
}

export function useSaveExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation<ExchangeRate, ApiError, SaveExchangeRateRequest>({
    mutationFn: exchangeRatesApi.save,
    onSuccess: () => invalidateAfterChange(queryClient),
  });
}

export function useDeleteExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await exchangeRatesApi.remove(id);
    },
    onSuccess: () => invalidateAfterChange(queryClient),
  });
}
