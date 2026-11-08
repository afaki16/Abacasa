// Categories modülü sorguları ve mutation'ları (CategoriesController).
// Yetkiler: Categories.Read / Create / Update / Delete.

import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ApiError, getNextPage, type PagedResult } from '@/lib/api';

import { categoriesApi } from './api';
import type {
  Category,
  CategoryDetail,
  CategoryListParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from './types';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
  /** Seçiciler için tüm kategoriler. */
  options: () => [...categoryKeys.all, 'options'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

/**
 * Kategori adı değişince adı gösteren başka önbellekler de tazelenir:
 * harcama satırları ve özetin kategori kırılımı (['expenses']), sabit ödeme satırları (['recurringPayments']).
 */
const RENAME_AFFECTED_ROOTS = [['expenses'], ['recurringPayments']] as const;

function invalidateOwn(queryClient: QueryClient) {
  // lists + options + details: seçicilerdeki liste de güncel kalsın.
  return queryClient.invalidateQueries({ queryKey: categoryKeys.all });
}

export function useCategoriesInfinite(params: CategoryListParams) {
  return useInfiniteQuery<PagedResult<Category>, ApiError>({
    queryKey: categoryKeys.list(params),
    queryFn: ({ pageParam }) => categoriesApi.list(pageParam as number, params),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
  });
}

/** Harcama/sabit ödeme formlarındaki kategori seçicisi. */
export function useCategoryOptions() {
  return useQuery<Category[], ApiError>({
    queryKey: categoryKeys.options(),
    queryFn: categoriesApi.options,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(id: number) {
  const queryClient = useQueryClient();
  return useQuery<CategoryDetail, ApiError>({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesApi.get(id),
    enabled: Number.isFinite(id),
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: PagedResult<Category>[] }>({ queryKey: categoryKeys.lists() })
        .flatMap(([, data]) => data?.pages.flatMap((p) => p.items) ?? [])
        .find((c) => c.id === id),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, CreateCategoryRequest>({
    mutationFn: categoriesApi.create,
    onSuccess: () => invalidateOwn(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, UpdateCategoryRequest>({
    mutationFn: categoriesApi.update,
    onSuccess: () =>
      Promise.all([
        invalidateOwn(queryClient),
        ...RENAME_AFFECTED_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]),
  });
}

/** Kullanımdaki kategori silinemez (409); başarılı silme yalnızca kategori önbelleğini etkiler. */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await categoriesApi.remove(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) });
      return invalidateOwn(queryClient);
    },
  });
}
