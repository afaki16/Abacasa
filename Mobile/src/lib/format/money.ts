// Para gösterimi. Web'deki useMoney ile aynı çıktı (tr-TR biçimi, dil ne olursa olsun):
//   formatMoney(1234.5)            → "₺1.234,50"
//   formatMoney(250, 'USD')        → "$250,00"
//   formatAmount(3, 'QuarterGold') → "3 çeyrek" / "3 quarters"
//   formatOpenLine(29000, [...])   → "₺29.000,00 · $1.700,00 · 3 çeyrek"
// Intl'e bağlı değildir (Hermes/iOS/Android ve Jest'te aynı sonuç).

import { plural } from '@/lib/i18n';
import type { Currency } from '@/lib/domain/enums';

export type MoneyCode = 'TRY' | 'USD' | 'EUR';

const SYMBOLS: Record<MoneyCode, string> = { TRY: '₺', USD: '$', EUR: '€' };

/** Binlik ayırıcı nokta, ondalık virgül. */
export function formatNumber(value: number, fractionDigits = 2): string {
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [intPart, frac] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  return sign + (frac ? `${grouped},${frac}` : grouped);
}

export function formatMoney(amount: number | null | undefined, code: MoneyCode = 'TRY'): string {
  if (amount === null || amount === undefined) return '—';
  const text = formatNumber(amount, 2);
  return text.startsWith('-') ? `-${SYMBOLS[code]}${text.slice(1)}` : `${SYMBOLS[code]}${text}`;
}

/** Tutar kendi biriminde: TL/Dolar/Euro para biçimi, çeyrek altın adet ("3 çeyrek"). */
export function formatAmount(amount: number | null | undefined, currency: Currency): string {
  if (amount === null || amount === undefined) return '—';
  if (currency === 'QuarterGold') {
    return plural('money.quarterCount', Math.abs(amount), { n: formatNumber(amount, 0) });
  }
  return formatMoney(amount, currency);
}

/** Açık tutar satırı: TL ve yabancı birimler tek satırda, aralarında " · ". */
export function formatOpenLine(openTry: number, foreign: { currency: Currency; open: number }[]): string {
  return [formatMoney(openTry), ...foreign.map((f) => formatAmount(f.open, f.currency))].join(' · ');
}
