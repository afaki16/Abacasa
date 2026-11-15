// ExchangeRates uçları (ExchangeRatesController). Yetkiler: ExchangeRates.Read / Create / Delete.
// Liste sayfalı değildir: hanenin son 20 kuru, tarihe göre yeniden eskiye.

import { apiGet, apiPost, apiSend } from '@/lib/api';

import type { CurrentRate, ExchangeRate, ExchangeRateListParams, SaveExchangeRateRequest } from './types';

export const EXCHANGE_RATES_ENDPOINTS = {
  LIST: '/api/ExchangeRates',
  DETAIL: (id: number) => `/api/ExchangeRates/${id}`,
  AS_OF: '/api/ExchangeRates/as-of',
} as const;

export const exchangeRatesApi = {
  list({ currency }: ExchangeRateListParams = {}): Promise<ExchangeRate[]> {
    return apiGet<ExchangeRate[]>(EXCHANGE_RATES_ENDPOINTS.LIST, { currency });
  },

  /**
   * Tarihte geçerli kurlar: o tarih ve öncesindeki en son elle / TCMB kurundan yeni olan (eşitse elle). TCMB
   * listesi kayıtlı değilse backend arşivden çeker. Kuru olmayan birim listede yoktur.
   */
  asOf(date: string, today: string): Promise<CurrentRate[]> {
    return apiGet<CurrentRate[]>(EXCHANGE_RATES_ENDPOINTS.AS_OF, { date, today });
  },

  /** Aynı birim ve tarih varsa günceller (200), yoksa ekler (201); ikisinde de kaydı döner. */
  save(request: SaveExchangeRateRequest): Promise<ExchangeRate> {
    return apiPost<ExchangeRate>(EXCHANGE_RATES_ENDPOINTS.LIST, request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', EXCHANGE_RATES_ENDPOINTS.DETAIL(id));
  },
};
