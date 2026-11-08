// Donations modülü sorguları ve mutation'ları (bağışlar, özet, emanetten dağıtımlar).

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { donationsApi } from './api';
import type {
  CreateDonationRequest,
  DonationDetail,
  DonationListItem,
  DonationListParams,
  DonationSummary,
  UpdateDonationRequest,
} from './types';

/** Emanet dağıtımları listesi tek sayfada (backend bağış listesi üst sınırı 100). */
const FUND_DISTRIBUTIONS_PAGE_SIZE = 100;

export const donationKeys = {
  all: ['donations'] as const,
  lists: () => [...donationKeys.all, 'list'] as const,
  list: (params: DonationListParams) => [...donationKeys.lists(), params] as const,
  summaries: () => [...donationKeys.all, 'summary'] as const,
  summary: (params: DonationListParams) => [...donationKeys.summaries(), params] as const,
  details: () => [...donationKeys.all, 'detail'] as const,
  detail: (id: number) => [...donationKeys.details(), id] as const,
  fundDistributions: (fundId: number) => [...donationKeys.all, 'fundDistributions', fundId] as const,
};

/**
 * Bağış değişince (kayıtta emanet/plan bağı bilinmediğinden hepsi):
 * - Özet: bağışlar birleşik dönem toplamına girer.
 * - Yıllık tablo: plan dışı bağışlar ve plan ödemeleri satırları.
 * - Bağış hedefleri: rapordaki "verilen".
 * - Emanetler: emanetten dağıtılan bağış (fundId) dağıtılan/elde tutarını değiştirir.
 * - Sabit ödemeler: plana bağlı bağış silinir/değişirse vadenin ödenme durumu değişir.
 */
function invalidateDonations(queryClient: QueryClient) {
  return Promise.all(
    [donationKeys.all, ['dashboard'], ['ledger'], ['donationTargets'], ['donationFunds'], ['recurringPayments']].map(
      (queryKey) => queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

export function useDonationsInfinite(params: DonationListParams) {
  return useInfiniteQuery<PagedResult<DonationListItem>, ApiError>({
    queryKey: donationKeys.list(params),
    queryFn: ({ pageParam }) => donationsApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

export function useDonationSummary(params: DonationListParams) {
  return useQuery<DonationSummary, ApiError>({
    queryKey: donationKeys.summary(params),
    queryFn: () => donationsApi.summary(params),
  });
}

export function useDonation(id: number) {
  const queryClient = useQueryClient();
  return useQuery<DonationDetail, ApiError>({
    queryKey: donationKeys.detail(id),
    queryFn: () => donationsApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<DonationListItem>[] }>({ queryKey: donationKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((d) => d.id === id),
  });
}

/** Bir emanetten dağıtılan bağışlar (web: FundDistributionsDialog). */
export function useFundDistributions(fundId: number) {
  return useQuery<DonationListItem[], ApiError>({
    queryKey: donationKeys.fundDistributions(fundId),
    queryFn: async () => (await donationsApi.list(1, { fundId }, FUND_DISTRIBUTIONS_PAGE_SIZE)).items,
    enabled: Number.isFinite(fundId),
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  return useMutation<DonationListItem, ApiError, CreateDonationRequest>({
    mutationFn: donationsApi.create,
    onSuccess: () => invalidateDonations(queryClient),
  });
}

export function useUpdateDonation() {
  const queryClient = useQueryClient();
  return useMutation<DonationListItem, ApiError, UpdateDonationRequest>({
    mutationFn: donationsApi.update,
    onSuccess: () => invalidateDonations(queryClient),
  });
}

export function useDeleteDonation() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await donationsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: donationKeys.detail(id) });
      return invalidateDonations(queryClient);
    },
  });
}
