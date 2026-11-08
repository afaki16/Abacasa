// Donations uçları (DonationsController). Yetkiler: Donations.Read / Create / Update / Delete.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import { buildDonationFilterQuery } from './params';
import type {
  CreateDonationRequest,
  DonationDetail,
  DonationListItem,
  DonationListParams,
  DonationSummary,
  UpdateDonationRequest,
} from './types';

export const DONATIONS_ENDPOINTS = {
  LIST: '/api/Donations',
  SUMMARY: '/api/Donations/summary',
  DETAIL: (id: number) => `/api/Donations/${id}`,
} as const;

export const donationsApi = {
  list(page: number, params: DonationListParams = {}, pageSize = DEFAULT_PAGE_SIZE): Promise<PagedResult<DonationListItem>> {
    return apiGet<PagedResult<DonationListItem>>(DONATIONS_ENDPOINTS.LIST, {
      page,
      pageSize,
      ...buildDonationFilterQuery(params),
    });
  },

  /** Listeyle aynı filtrelerle toplamlar (tür ve veren kişi bazında). */
  summary(params: DonationListParams = {}): Promise<DonationSummary> {
    return apiGet<DonationSummary>(DONATIONS_ENDPOINTS.SUMMARY, buildDonationFilterQuery(params));
  },

  get(id: number): Promise<DonationDetail> {
    return apiGet<DonationDetail>(DONATIONS_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateDonationRequest): Promise<DonationListItem> {
    return apiPost<DonationListItem>(DONATIONS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateDonationRequest): Promise<DonationListItem> {
    return apiPut<DonationListItem>(DONATIONS_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', DONATIONS_ENDPOINTS.DETAIL(id));
  },
};
