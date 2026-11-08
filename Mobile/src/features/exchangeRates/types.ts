// Backend: Abacasa.Application/Features/ExchangeRates/Dtos/ExchangeRateDto.cs
// (ExchangeRateDto, SaveExchangeRateDto, CurrentRateDto).

import type { Currency } from '@/lib/domain/enums';

/** Hanenin elle girdiği kur (GET /api/ExchangeRates öğesi). Çeyrekte 1 adedin TL fiyatı. */
export interface ExchangeRate {
  id: number;
  currency: Currency;
  rate: number;
  /** 'YYYY-MM-DD' */
  date: string;
  createdDate: string;
}

export interface ExchangeRateListParams {
  /** Boşsa tüm birimler. */
  currency?: Currency;
}

/** Aynı (birim, tarih) kaydı varsa güncellenir, yoksa eklenir. TRY gönderilemez. */
export interface SaveExchangeRateRequest {
  currency: Currency;
  /** > 0 */
  rate: number;
  /** 'YYYY-MM-DD'; zorunlu. */
  date: string;
}

/** "TCMB" (günlük otomatik döviz satış) ya da "Elle" (hanenin girdiği). */
export type CurrentRateSource = 'TCMB' | 'Elle';

/**
 * Bir birimin güncel kuru: TCMB ile elle girilen kurdan tarihi yeni olan (eşitse elle).
 * Ayrı uç yoktur; borç özeti (`/api/Debts/summary` → rates) ve dönem özeti (`debts.rates`) içinde gelir.
 */
export interface CurrentRate {
  currency: Currency;
  rate: number;
  date: string;
  source: CurrentRateSource;
}
