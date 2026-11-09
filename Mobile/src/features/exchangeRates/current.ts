// Döviz kurları ekranı için saf yardımcılar: birim kartları ve kur girişi.
// Güncel kur = TCMB (USD, EUR; günlük otomatik) ile hanenin elle girdiği kurdan tarihi yeni olan; eşitse elle.
// Ayrı "güncel kur" ucu yoktur; dönem özeti / borç özeti içindeki rates kullanılır.

import { FOREIGN_CURRENCIES, type Currency } from '@/lib/domain/enums';
import { formatNumber } from '@/lib/format/money';

import type { CurrentRate, CurrentRateSource, ExchangeRate } from './types';

export interface RateCardModel {
  currency: Currency;
  rate: number | null;
  date: string | null;
  source: CurrentRateSource | null;
  /** Güncel kur elle girildiyse o kaydın id'si ("Merkez bankasına dön" = bu kaydı sil). */
  manualId: number | null;
}

/**
 * Her yabancı birim için kart. `current` (özetten gelen güncel kurlar) yoksa — kullanıcının özet izni
 * yoksa — elle girilen son kur gösterilir.
 */
export function buildRateCards(
  current: readonly CurrentRate[] | undefined,
  manual: readonly ExchangeRate[],
): RateCardModel[] {
  return FOREIGN_CURRENCIES.map((currency) => {
    const own = manual
      .filter((r) => r.currency === currency)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const fromSummary = current?.find((r) => r.currency === currency);
    if (current === undefined) {
      const latest = own[0];
      return latest
        ? { currency, rate: latest.rate, date: latest.date, source: 'Elle', manualId: latest.id }
        : { currency, rate: null, date: null, source: null, manualId: null };
    }
    if (!fromSummary) return { currency, rate: null, date: null, source: null, manualId: null };
    const manualId =
      fromSummary.source === 'Elle'
        ? (own.find((r) => r.date === fromSummary.date)?.id ?? null)
        : null;
    return {
      currency,
      rate: fromSummary.rate,
      date: fromSummary.date,
      source: fromSummary.source,
      manualId,
    };
  });
}

/** Kur gösterimi: döviz 4 ondalık ("₺41,8520"), çeyrek fiyatı 2 ondalık ("₺4.250,00"). */
export function formatRate(rate: number | null | undefined, currency: Currency): string {
  if (rate === null || rate === undefined) return '—';
  return `₺${formatNumber(rate, currency === 'QuarterGold' ? 2 : 4)}`;
}

/** Kur alanı yazımı: rakamlar + tek ondalık virgül ("." de virgül sayılır), en fazla 4 ondalık (decimal(18,4)). */
export function sanitizeRateInput(raw: string): string {
  const text = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const comma = text.indexOf(',');
  if (comma === -1) return text.replace(/^0+(?=\d)/, '').slice(0, 9);
  const intPart = (text.slice(0, comma).replace(/^0+(?=\d)/, '') || '0').slice(0, 9);
  const frac = text
    .slice(comma + 1)
    .replace(/,/g, '')
    .slice(0, 4);
  return `${intPart},${frac}`;
}

/** Ham kur → sayı; boş/geçersizse null. */
export function parseRateInput(raw: string): number | null {
  if (!raw || raw === ',') return null;
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}
