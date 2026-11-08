// Categories uçları (CategoriesController). Yetkiler: Categories.Read / Create / Update / Delete.
// Bağlı harcaması olan kategori silinemez (409, "kullanımda").

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import { CATEGORY_OPTIONS_PAGE_SIZE } from './constants';
import type {
  Category,
  CategoryDetail,
  CategoryListParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from './types';

export const CATEGORIES_ENDPOINTS = {
  LIST: '/api/Categories',
  DETAIL: (id: number) => `/api/Categories/${id}`,
} as const;

export const categoriesApi = {
  list(page: number, { searchTerm }: CategoryListParams = {}): Promise<PagedResult<Category>> {
    return apiGet<PagedResult<Category>>(CATEGORIES_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
    });
  },

  /** Seçiciler için tüm kategoriler (tek sayfa). */
  async options(): Promise<Category[]> {
    const result = await apiGet<PagedResult<Category>>(CATEGORIES_ENDPOINTS.LIST, {
      page: 1,
      pageSize: CATEGORY_OPTIONS_PAGE_SIZE,
    });
    return result.items;
  },

  get(id: number): Promise<CategoryDetail> {
    return apiGet<CategoryDetail>(CATEGORIES_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateCategoryRequest): Promise<Category> {
    return apiPost<Category>(CATEGORIES_ENDPOINTS.LIST, request);
  },

  update(request: UpdateCategoryRequest): Promise<Category> {
    return apiPut<Category>(CATEGORIES_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', CATEGORIES_ENDPOINTS.DETAIL(id));
  },
};
