// Users modülü sorguları ve mutation'ları. Yeni modül eklerken bu dosyayı şablon al.

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { usersApi } from './api';
import type { CreateUserRequest, UpdateUserRequest, UserDetail, UserListItem, UserListParams } from './types';

/**
 * Hiyerarşik sorgu anahtarları. invalidateQueries({ queryKey: userKeys.lists() }) tüm
 * listeleri (her arama/filtre) tazeler; detail(id) tek kaydı.
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
};

/** Sonsuz kaydırmalı liste (sayfa sayfa). */
export function useUsersInfinite(params: UserListParams) {
  return useInfiniteQuery<PagedResult<UserListItem>, ApiError>({
    queryKey: userKeys.list(params),
    queryFn: ({ pageParam }) => usersApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

export function useUser(id: number) {
  const queryClient = useQueryClient();
  return useQuery<UserDetail, ApiError>({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: Number.isFinite(id),
    // Listeden gelindiyse kaydı hemen göster, arka planda tazele.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<UserListItem>[] }>({ queryKey: userKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((u) => u.id === id),
  });
}

export function useRoleOptions() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: usersApi.roles,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserDetail, ApiError, CreateUserRequest>({
    mutationFn: usersApi.create,
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserDetail, ApiError, UpdateUserRequest>({
    mutationFn: usersApi.update,
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await usersApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
