// Bağış liste/özet sorgu parametreleri (saf fonksiyon).

import type { DonationListParams } from './types';

/** Filtreleri backend sorgusuna çevirir: dönem → startDate/endDate; boş arama gönderilmez. */
export function buildDonationFilterQuery({ searchTerm, period, kind, fundId }: DonationListParams) {
  return {
    searchTerm: searchTerm?.trim() || undefined,
    startDate: period?.start,
    endDate: period?.end,
    kind,
    fundId,
  };
}
