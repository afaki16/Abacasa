// Vehicles modülü sorguları ve mutation'ları (araçlar, işlemler, hatırlatmalar).

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { vehiclesApi } from './api';
import type {
  CreateVehicleObligationVariables,
  CreateVehicleRequest,
  DeleteVehicleObligationVariables,
  UpdateVehicleObligationVariables,
  UpdateVehicleRequest,
  Vehicle,
  VehicleListParams,
  VehicleObligation,
  VehicleReminder,
} from './types';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (params: VehicleListParams) => [...vehicleKeys.lists(), params] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: number) => [...vehicleKeys.details(), id] as const,
  obligations: (vehicleId: number) => [...vehicleKeys.all, 'obligations', vehicleId] as const,
  upcoming: (today: string) => [...vehicleKeys.all, 'upcoming', today] as const,
};

/**
 * Araç/işlem değişince araçlar (güncel kayıtlar, hatırlatmalar) ve Özet tazelenir: araç hatırlatmaları
 * Özet'te listelenir (hiçbir toplama girmez).
 */
function invalidateVehicles(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

/**
 * İşlemin bağlı harcaması oluştu/değişti/silindiyse harcamalar ve Yıllık tablo (plan dışı harcama
 * kategori satırları) da tazelenir; Özet zaten invalidateVehicles ile tazelenir.
 */
function invalidateObligation(queryClient: QueryClient, hasExpense: boolean) {
  const tasks = [invalidateVehicles(queryClient)];
  if (hasExpense) {
    tasks.push(
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['ledger'] }),
      ]),
    );
  }
  return Promise.all(tasks);
}

export function useVehiclesInfinite(params: VehicleListParams) {
  return useInfiniteQuery<PagedResult<Vehicle>, ApiError>({
    queryKey: vehicleKeys.list(params),
    queryFn: ({ pageParam }) => vehiclesApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

export function useVehicle(id: number) {
  const queryClient = useQueryClient();
  return useQuery<Vehicle, ApiError>({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<Vehicle>[] }>({ queryKey: vehicleKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((v) => v.id === id),
  });
}

export function useVehicleObligations(vehicleId: number) {
  return useQuery<VehicleObligation[], ApiError>({
    queryKey: vehicleKeys.obligations(vehicleId),
    queryFn: () => vehiclesApi.obligations(vehicleId),
    enabled: Number.isFinite(vehicleId),
  });
}

/** today ('YYYY-MM-DD') anahtarda; gün değişince yeniden çekilir. */
export function useVehicleReminders(today: string) {
  return useQuery<VehicleReminder[], ApiError>({
    queryKey: vehicleKeys.upcoming(today),
    queryFn: () => vehiclesApi.upcoming(today),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation<Vehicle, ApiError, CreateVehicleRequest>({
    mutationFn: vehiclesApi.create,
    onSuccess: () => invalidateVehicles(queryClient),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation<Vehicle, ApiError, UpdateVehicleRequest>({
    mutationFn: vehiclesApi.update,
    onSuccess: (vehicle) => {
      queryClient.setQueryData(vehicleKeys.detail(vehicle.id), vehicle);
      return invalidateVehicles(queryClient);
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await vehiclesApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: vehicleKeys.detail(id) });
      queryClient.removeQueries({ queryKey: vehicleKeys.obligations(id) });
      return invalidateVehicles(queryClient);
    },
  });
}

/** Gövde için buildObligationRequest kullanılır. */
export function useCreateVehicleObligation() {
  const queryClient = useQueryClient();
  return useMutation<VehicleObligation, ApiError, CreateVehicleObligationVariables>({
    mutationFn: ({ vehicleId, ...request }) => vehiclesApi.createObligation(vehicleId, request),
    onSuccess: (obligation) => invalidateObligation(queryClient, obligation.hasExpense),
  });
}

export function useUpdateVehicleObligation() {
  const queryClient = useQueryClient();
  return useMutation<VehicleObligation, ApiError, UpdateVehicleObligationVariables>({
    mutationFn: ({ vehicleId, obligationId, ...request }) => vehiclesApi.updateObligation(vehicleId, obligationId, request),
    onSuccess: (obligation) => invalidateObligation(queryClient, obligation.hasExpense),
  });
}

export function useDeleteVehicleObligation() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, DeleteVehicleObligationVariables>({
    mutationFn: async ({ vehicleId, obligationId }) => {
      await vehiclesApi.removeObligation(vehicleId, obligationId);
    },
    onSuccess: (_, { hasExpense }) => invalidateObligation(queryClient, hasExpense),
  });
}
