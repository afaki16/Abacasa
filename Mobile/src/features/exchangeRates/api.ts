// ExchangeRates uçları (ExchangeRatesController). Yetkiler: ExchangeRates.Read / Create / Delete.
// Liste sayfalı değildir: hanenin son 20 kuru, tarihe göre yeniden eskiye.

import { apiGet, apiPost, apiSend } from '@/lib/api';

import type { ExchangeRate, ExchangeRateListParams, SaveExchangeRateRequest } from './types';

export const EXCHANGE_RATES_ENDPOINTS = {
  LIST: '/api/ExchangeRates',
  DETAIL: (id: number) => `/api/ExchangeRates/${id}`,
} as const;

export const exchangeRatesApi = {
  list({ currency }: ExchangeRateListParams = {}): Promise<ExchangeRate[]> {
    return apiGet<ExchangeRate[]>(EXCHANGE_RATES_ENDPOINTS.LIST, { currency });
  },

  /** Aynı birim ve tarih varsa günceller (200), yoksa ekler (201); ikisinde de kaydı döner. */
  save(request: SaveExchangeRateRequest): Promise<ExchangeRate> {
    return apiPost<ExchangeRate>(EXCHANGE_RATES_ENDPOINTS.LIST, request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', EXCHANGE_RATES_ENDPOINTS.DETAIL(id));
  },
};
