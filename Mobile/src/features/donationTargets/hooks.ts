// DonationTargets modülü sorguları ve mutation'ları (yıllık bağış hedefleri ve rapor).
// Rapor bağışlara ve bağış planlarına bağlıdır; o modüller ['donationTargets'] anahtarını geçersiz kılar.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api';

import { donationTargetsApi } from './api';
import type {
  CreateDonationTargetRequest,
  DonationTarget,
  DonationTargetReport,
  UpdateDonationTargetRequest,
} from './types';

export const donationTargetKeys = {
  all: ['donationTargets'] as const,
  lists: () => [...donationTargetKeys.all, 'list'] as const,
  list: (year: number) => [...donationTargetKeys.lists(), year] as const,
  details: () => [...donationTargetKeys.all, 'detail'] as const,
  detail: (id: number) => [...donationTargetKeys.details(), id] as const,
  reports: () => [...donationTargetKeys.all, 'report'] as const,
  report: (year: number, today: string) => [...donationTargetKeys.reports(), year, today] as const,
};

export function useDonationTargets(year: number) {
  return useQuery<DonationTarget[], ApiError>({
    queryKey: donationTargetKeys.list(year),
    queryFn: () => donationTargetsApi.listByYear(year),
  });
}

export function useDonationTarget(id: number) {
  const queryClient = useQueryClient();
  return useQuery<DonationTarget, ApiError>({
    queryKey: donationTargetKeys.detail(id),
    queryFn: () => donationTargetsApi.get(id),
    enabled: Number.isFinite(id),
    // Yıl listesinden gelindiyse kaydı hemen göster.
    placeholderData: () =>
      queryClient
        .getQueriesData<DonationTarget[]>({ queryKey: donationTargetKeys.lists() })
        .flatMap(([, data]) => data ?? [])
        .find((t) => t.id === id),
  });
}

/** today ('YYYY-MM-DD') anahtarda; gün değişince rapor yeniden çekilir. */
export function useDonationTargetReport(year: number, today: string) {
  return useQuery<DonationTargetReport, ApiError>({
    queryKey: donationTargetKeys.report(year, today),
    queryFn: () => donationTargetsApi.report(year, today),
  });
}

/** Hedef değişikliği yalnızca bu modülün liste ve raporunu etkiler. */
function useInvalidateTargets() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: donationTargetKeys.all });
}

export function useCreateDonationTarget() {
  const invalidate = useInvalidateTargets();
  return useMutation<DonationTarget, ApiError, CreateDonationTargetRequest>({
    mutationFn: donationTargetsApi.create,
    onSuccess: invalidate,
  });
}

export function useUpdateDonationTarget() {
  const invalidate = useInvalidateTargets();
  return useMutation<DonationTarget, ApiError, UpdateDonationTargetRequest>({
    mutationFn: donationTargetsApi.update,
    onSuccess: invalidate,
  });
}

export function useDeleteDonationTarget() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await donationTargetsApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: donationTargetKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: donationTargetKeys.all });
    },
  });
}
