// Tutar alanı (AmountField) yazım kuralları. Ham değer: rakamlar + en fazla bir ondalık virgül
// ("1234,5"). Gösterim tr-TR biçiminde, yazarken de gruplanır ("₺1.234,5").
//   - Para (TRY/USD/EUR): en fazla 2 ondalık. Klavyedeki "." ondalık sayılır (iOS/İngilizce klavye).
//   - Çeyrek altın: yalnızca tam sayı.
// Intl'e bağlı değildir.

import type { Currency } from '@/lib/domain/enums';

/** decimal(18,2) sınırının altında, makul bir tam kısım uzunluğu. */
const MAX_INT_DIGITS = 13;

const SYMBOLS: Partial<Record<Currency, string>> = { TRY: '₺', USD: '$', EUR: '€' };

export const amountSymbol = (currency: Currency): string => SYMBOLS[currency] ?? '';

/** Ham değeri kurallara uydurur: fazladan virgül, fazla ondalık, baştaki sıfırlar atılır. */
export function sanitizeAmountInput(raw: string, currency: Currency): string {
  const whole = currency === 'QuarterGold';
  let text = raw.replace(/[^\d,]/g, '');
  if (whole) text = text.split(',')[0];

  const comma = text.indexOf(',');
  let intPart = comma === -1 ? text : text.slice(0, comma);
  let frac = comma === -1 ? null : text.slice(comma + 1).replace(/,/g, '').slice(0, 2);

  intPart = intPart.replace(/^0+(?=\d)/, '').slice(0, MAX_INT_DIGITS);
  if (frac !== null && intPart === '') intPart = '0';
  return frac === null ? intPart : `${intPart},${frac}`;
}

/** Ham değer → sayı. Boş ya da yalnızca virgülse null. */
export function parseAmountInput(raw: string): number | null {
  if (!raw || raw === ',') return null;
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** Ham değeri gruplar: "1234,5" → "1.234,5" (yazarken kısmi ondalık korunur). */
export function groupAmountInput(raw: string): string {
  if (!raw) return '';
  const [intPart, frac] = raw.split(',');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return frac === undefined ? grouped : `${grouped},${frac}`;
}

/** Alanda görünen metin: sembol + gruplanmış değer ("₺1.234,5"); çeyrekte sembol yok. */
export function formatAmountInput(raw: string, currency: Currency): string {
  if (!raw) return '';
  return `${amountSymbol(currency)}${groupAmountInput(raw)}`;
}

/** Kayıtlı sayıyı düzenleme için ham değere çevirir: 1234.5 → "1234,50", çeyrek 3 → "3". */
export function amountToInput(value: number | null | undefined, currency: Currency): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  if (currency === 'QuarterGold') return String(Math.trunc(Math.abs(value)));
  return Math.abs(value).toFixed(2).replace('.', ',');
}

/**
 * Alanın onChangeText'i: yeni görünen metinden yeni ham değeri çıkarır.
 * Sona tek karakter eklendiyse yalnızca o karakter işlenir ("." → ondalık virgül).
 * Silme ya da yapıştırmada gruplama noktaları atılır; yapıştırılan "12.50" gibi tek noktalı ve
 * 1–2 ondalıklı değer ondalık sayılır.
 */
export function nextAmountInput(prevRaw: string, nextText: string, currency: Currency): string {
  const prevDisplay = formatAmountInput(prevRaw, currency);
  if (nextText.length === prevDisplay.length + 1 && nextText.startsWith(prevDisplay)) {
    const typed = nextText.slice(-1);
    const char = typed === '.' ? ',' : typed;
    return sanitizeAmountInput(prevRaw + char, currency);
  }

  let text = nextText.replace(/[^\d.,]/g, '');
  // Yalnızca ekleme/yapıştırmada: silmede "₺1.234" → "₺1.23" ondalık sanılmasın.
  const inserted = nextText.length > prevDisplay.length;
  if (inserted && !text.includes(',') && /^\d+\.\d{1,2}$/.test(text)) text = text.replace('.', ',');
  return sanitizeAmountInput(text.replace(/\./g, ''), currency);
}
