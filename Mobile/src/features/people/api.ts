// People uçları (PeopleController). Yetkiler: People.Read / Create / Update / Delete.
// Başka kayıtların bağlı olduğu kişi (ör. ödeme aracı sahibi) silinemez (409, "kullanımda").

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import { PERSON_OPTIONS_PAGE_SIZE } from './constants';
import type { CreatePersonRequest, Person, PersonDetail, PersonListParams, UpdatePersonRequest } from './types';

export const PEOPLE_ENDPOINTS = {
  LIST: '/api/People',
  DETAIL: (id: number) => `/api/People/${id}`,
} as const;

export const peopleApi = {
  list(page: number, { searchTerm }: PersonListParams = {}): Promise<PagedResult<Person>> {
    return apiGet<PagedResult<Person>>(PEOPLE_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
    });
  },

  /** Seçiciler için hanenin tüm kişileri (tek sayfa). */
  async options(): Promise<Person[]> {
    const result = await apiGet<PagedResult<Person>>(PEOPLE_ENDPOINTS.LIST, {
      page: 1,
      pageSize: PERSON_OPTIONS_PAGE_SIZE,
    });
    return result.items;
  },

  get(id: number): Promise<PersonDetail> {
    return apiGet<PersonDetail>(PEOPLE_ENDPOINTS.DETAIL(id));
  },

  create(request: CreatePersonRequest): Promise<Person> {
    return apiPost<Person>(PEOPLE_ENDPOINTS.LIST, request);
  },

  update(request: UpdatePersonRequest): Promise<Person> {
    return apiPut<Person>(PEOPLE_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', PEOPLE_ENDPOINTS.DETAIL(id));
  },
};
