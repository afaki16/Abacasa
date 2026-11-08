// People modülü sorguları ve mutation'ları (PeopleController).
// Yetkiler: People.Read / Create / Update / Delete.

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { peopleApi } from './api';
import type { CreatePersonRequest, Person, PersonDetail, PersonListParams, UpdatePersonRequest } from './types';

export const personKeys = {
  all: ['people'] as const,
  lists: () => [...personKeys.all, 'list'] as const,
  list: (params: PersonListParams) => [...personKeys.lists(), params] as const,
  /** Seçiciler için tüm kişiler. */
  options: () => [...personKeys.all, 'options'] as const,
  details: () => [...personKeys.all, 'detail'] as const,
  detail: (id: number) => [...personKeys.details(), id] as const,
};

/**
 * Kişi adı birçok kayıtta düz alan olarak döner; ad değişince bunları gösteren önbellekler tazelenir:
 * harcama sahibi (['expenses']), özetin kişi kırılımı (['dashboard']), ödeme aracı sahibi (['paymentMethods']),
 * sabit ödeme / bağış / borç / yıllık tablo / araç / bağış hedefi / emanet satırları ve
 * hane üyelerine bağlı kişi adı (['household']).
 */
const RENAME_AFFECTED_ROOTS = [
  ['expenses'],
  ['dashboard'],
  ['paymentMethods'],
  ['recurringPayments'],
  ['donations'],
  ['donationTargets'],
  ['donationFunds'],
  ['debts'],
  ['ledger'],
  ['vehicles'],
  ['household'],
] as const;

function invalidateOwn(queryClient: QueryClient) {
  // lists + options + details: seçicilerdeki liste de güncel kalsın.
  return queryClient.invalidateQueries({ queryKey: personKeys.all });
}

export function usePeopleInfinite(params: PersonListParams) {
  return useInfiniteQuery<PagedResult<Person>, ApiError>({
    queryKey: personKeys.list(params),
    queryFn: ({ pageParam }) => peopleApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

/** Sahip / veren / alacaklı seçicileri. */
export function usePersonOptions() {
  return useQuery<Person[], ApiError>({
    queryKey: personKeys.options(),
    queryFn: peopleApi.options,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePerson(id: number) {
  const queryClient = useQueryClient();
  return useQuery<PersonDetail, ApiError>({
    queryKey: personKeys.detail(id),
    queryFn: () => peopleApi.get(id),
    enabled: Number.isFinite(id),
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<Person>[] }>({ queryKey: personKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((p) => p.id === id),
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation<Person, ApiError, CreatePersonRequest>({
    mutationFn: peopleApi.create,
    onSuccess: () => invalidateOwn(queryClient),
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation<Person, ApiError, UpdatePersonRequest>({
    mutationFn: peopleApi.update,
    onSuccess: () =>
      Promise.all([
        invalidateOwn(queryClient),
        ...RENAME_AFFECTED_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]),
  });
}

/**
 * Kullanımdaki kişi silinemez (409). Üyelik/davet bağı silmeyi engellemez; silinen kişi üye ve davet
 * listelerinde görünmesin diye bunlar da tazelenir (['household']).
 */
export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await peopleApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: personKeys.detail(id) });
      return Promise.all([invalidateOwn(queryClient), queryClient.invalidateQueries({ queryKey: ['household'] })]);
    },
  });
}
