// Users uçları (UsersController). Yetkiler: Users.Read / Create / Update / Delete.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import type {
  CreateUserRequest,
  RoleOption,
  UpdateUserRequest,
  UserDetail,
  UserListItem,
  UserListParams,
} from './types';

export const USERS_ENDPOINTS = {
  LIST: '/api/Users',
  DETAIL: (id: number) => `/api/Users/${id}`,
  ROLES: '/api/Roles',
} as const;

export const usersApi = {
  list(page: number, { searchTerm, status }: UserListParams = {}): Promise<PagedResult<UserListItem>> {
    return apiGet<PagedResult<UserListItem>>(USERS_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
      status,
    });
  },

  get(id: number): Promise<UserDetail> {
    return apiGet<UserDetail>(USERS_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateUserRequest): Promise<UserDetail> {
    return apiPost<UserDetail>(USERS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateUserRequest): Promise<UserDetail> {
    return apiPut<UserDetail>(USERS_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', USERS_ENDPOINTS.DETAIL(id));
  },

  /** Formdaki rol seçici için (Roles.Read gerekir). */
  async roles(): Promise<RoleOption[]> {
    const result = await apiGet<PagedResult<RoleOption>>(USERS_ENDPOINTS.ROLES, { page: 1, pageSize: 100 });
    return result.items;
  },
};
