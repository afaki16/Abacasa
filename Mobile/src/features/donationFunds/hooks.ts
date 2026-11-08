// DonationFunds modülü sorguları ve mutation'ları (emanetler ve hareketleri).
// Emanetler hiçbir toplama girmez; dağıtımlar bağış kaydıdır ve bağış mutation'ları ['donationFunds']'ı tazeler.

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { donationFundsApi } from './api';
import type {
  CreateDonationFundRequest,
  CreateFundMovementVariables,
  DeleteFundMovementVariables,
  DonationFund,
  DonationFundListParams,
  FundMovement,
  UpdateDonationFundRequest,
  UpdateFundMovementVariables,
} from './types';

/** Dağıtım listesi bağış ucundan okunur; kolaylık için buradan da erişilir. */
export { useFundDistributions } from '@/features/donations/hooks';

export const donationFundKeys = {
  all: ['donationFunds'] as const,
  lists: () => [...donationFundKeys.all, 'list'] as const,
  list: (params: DonationFundListParams) => [...donationFundKeys.lists(), params] as const,
  details: () => [...donationFundKeys.all, 'detail'] as const,
  detail: (id: number) => [...donationFundKeys.details(), id] as const,
  movements: (fundId: number) => [...donationFundKeys.all, 'movements', fundId] as const,
};

/**
 * Emanet değişince emanetler ve bağışlar tazelenir: bağış satırındaki emanet etiketi ("Kimden · Tür")
 * ve bağış formundaki emanet seçenekleri emanete bağlıdır.
 */
function invalidateFunds(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: donationFundKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['donations'] }),
  ]);
}

export function useDonationFundsInfinite(params: DonationFundListParams) {
  return useInfiniteQuery<PagedResult<DonationFund>, ApiError>({
    queryKey: donationFundKeys.list(params),
    queryFn: ({ pageParam }) => donationFundsApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

export function useDonationFund(id: number) {
  const queryClient = useQueryClient();
  return useQuery<DonationFund, ApiError>({
    queryKey: donationFundKeys.detail(id),
    queryFn: () => donationFundsApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<DonationFund>[] }>({ queryKey: donationFundKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((f) => f.id === id),
  });
}

export function useFundMovements(fundId: number) {
  return useQuery<FundMovement[], ApiError>({
    queryKey: donationFundKeys.movements(fundId),
    queryFn: () => donationFundsApi.movements(fundId),
    enabled: Number.isFinite(fundId),
  });
}

export function useCreateDonationFund() {
  const queryClient = useQueryClient();
  return useMutation<DonationFund, ApiError, CreateDonationFundRequest>({
    mutationFn: donationFundsApi.create,
    onSuccess: () => invalidateFunds(queryClient),
  });
}

export function useUpdateDonationFund() {
  const queryClient = useQueryClient();
  return useMutation<DonationFund, ApiError, UpdateDonationFundRequest>({
    mutationFn: donationFundsApi.update,
    onSuccess: () => invalidateFunds(queryClient),
  });
}

export function useDeleteDonationFund() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await donationFundsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: donationFundKeys.detail(id) });
      return invalidateFunds(queryClient);
    },
  });
}

/** Hareketler yalnızca emanetin kullanımda/elde tutarını değiştirir (bağış kaydı oluşmaz). */
export function useCreateFundMovement() {
  const queryClient = useQueryClient();
  return useMutation<FundMovement, ApiError, CreateFundMovementVariables>({
    mutationFn: ({ fundId, ...request }) => donationFundsApi.createMovement(fundId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: donationFundKeys.all }),
  });
}

export function useUpdateFundMovement() {
  const queryClient = useQueryClient();
  return useMutation<FundMovement, ApiError, UpdateFundMovementVariables>({
    mutationFn: ({ fundId, movementId, ...request }) => donationFundsApi.updateMovement(fundId, movementId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: donationFundKeys.all }),
  });
}

export function useDeleteFundMovement() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, DeleteFundMovementVariables>({
    mutationFn: async ({ fundId, movementId }) => {
      await donationFundsApi.removeMovement(fundId, movementId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: donationFundKeys.all }),
  });
}
