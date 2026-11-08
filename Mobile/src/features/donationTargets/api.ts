// DonationTargets uçları (DonationTargetsController). Yetkiler: DonationTargets.Read / Create / Update / Delete.

import { apiGet, apiPost, apiPut, apiSend, type PagedResult } from '@/lib/api';
import { todayIso } from '@/lib/format/period';

import type {
  CreateDonationTargetRequest,
  DonationTarget,
  DonationTargetReport,
  UpdateDonationTargetRequest,
} from './types';

/** Bir yılın hedefleri tek sayfada (web ile aynı; backend üst sınırı 1000). */
const YEAR_PAGE_SIZE = 1000;

export const DONATION_TARGETS_ENDPOINTS = {
  LIST: '/api/DonationTargets',
  DETAIL: (id: number) => `/api/DonationTargets/${id}`,
  REPORT: (year: number) => `/api/DonationTargets/year/${year}`,
} as const;

export const donationTargetsApi = {
  /** Yılın hedefleri (sayfalı uç, tek sayfa olarak okunur). */
  async listByYear(year: number): Promise<DonationTarget[]> {
    const result = await apiGet<PagedResult<DonationTarget>>(DONATION_TARGETS_ENDPOINTS.LIST, {
      page: 1,
      pageSize: YEAR_PAGE_SIZE,
      year,
    });
    return result.items;
  },

  get(id: number): Promise<DonationTarget> {
    return apiGet<DonationTarget>(DONATION_TARGETS_ENDPOINTS.DETAIL(id));
  },

  /** Yıllık rapor; "planlanan" cihazın bugününden yıl sonuna kadar hesaplanır. */
  report(year: number, today: string = todayIso()): Promise<DonationTargetReport> {
    return apiGet<DonationTargetReport>(DONATION_TARGETS_ENDPOINTS.REPORT(year), { today });
  },

  create(request: CreateDonationTargetRequest): Promise<DonationTarget> {
    return apiPost<DonationTarget>(DONATION_TARGETS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateDonationTargetRequest): Promise<DonationTarget> {
    return apiPut<DonationTarget>(DONATION_TARGETS_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', DONATION_TARGETS_ENDPOINTS.DETAIL(id));
  },
};
