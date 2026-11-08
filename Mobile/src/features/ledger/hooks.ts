// Ledger modülü sorguları ve mutation'ları (yıllık tablo, elle kalemler, aylık tutarlar).
// Gider tarafı harcama/bağış/plan kayıtlarından hesaplanır; o modüller ['ledger'] anahtarını geçersiz kılar.
// Elle kalemler ve hücreler başka hiçbir toplama girmez; yalnızca bu modül tazelenir.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api';

import { ledgerApi } from './api';
import type {
  CreateLedgerItemRequest,
  LedgerItem,
  LedgerMonthlyAmount,
  LedgerYear,
  SetMonthlyAmountVariables,
  UpdateLedgerItemRequest,
} from './types';

export const ledgerKeys = {
  all: ['ledger'] as const,
  years: () => [...ledgerKeys.all, 'year'] as const,
  year: (year: number) => [...ledgerKeys.years(), year] as const,
  items: () => [...ledgerKeys.all, 'item'] as const,
  item: (id: number) => [...ledgerKeys.items(), id] as const,
};

export function useLedgerYear(year: number) {
  return useQuery<LedgerYear, ApiError>({
    queryKey: ledgerKeys.year(year),
    queryFn: () => ledgerApi.year(year),
  });
}

export function useLedgerItem(id: number) {
  return useQuery<LedgerItem, ApiError>({
    queryKey: ledgerKeys.item(id),
    queryFn: () => ledgerApi.getItem(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateLedgerItem() {
  const queryClient = useQueryClient();
  return useMutation<LedgerItem, ApiError, CreateLedgerItemRequest>({
    mutationFn: ledgerApi.createItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ledgerKeys.all }),
  });
}

export function useUpdateLedgerItem() {
  const queryClient = useQueryClient();
  return useMutation<LedgerItem, ApiError, UpdateLedgerItemRequest>({
    mutationFn: ledgerApi.updateItem,
    onSuccess: (item) => {
      queryClient.setQueryData(ledgerKeys.item(item.id), item);
      return queryClient.invalidateQueries({ queryKey: ledgerKeys.years() });
    },
  });
}

export function useDeleteLedgerItem() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await ledgerApi.removeItem(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ledgerKeys.item(id) });
      return queryClient.invalidateQueries({ queryKey: ledgerKeys.years() });
    },
  });
}

/** Hücre yazma; toplamlar backend'de hesaplandığı için yıl tablosu yeniden çekilir. */
export function useSetLedgerMonthlyAmount() {
  const queryClient = useQueryClient();
  return useMutation<LedgerMonthlyAmount, ApiError, SetMonthlyAmountVariables>({
    mutationFn: ledgerApi.setMonthlyAmount,
    onSuccess: (cell) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ledgerKeys.year(cell.year) }),
        // İlk tutar girilince kalemin hasAmounts alanı değişir.
        queryClient.invalidateQueries({ queryKey: ledgerKeys.item(cell.ledgerItemId) }),
      ]),
  });
}
