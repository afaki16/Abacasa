// Elle kalem formu (ad, yön, kişi, 12 aylık tutar) ↔ istek eşlemesi. Aylık tutarlar ayrı uçla yazılır
// (PUT /api/Ledger/items/{id}/amounts/{year}/{month}); yalnızca değişen aylar gönderilir.

import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';

/** Kayıtlı aylık değerler → alan metinleri ("52000,00"; girilmemiş ay boş). */
export function monthsToInputs(months: readonly (number | null)[]): string[] {
  return Array.from({ length: 12 }, (_, i) => amountToInput(months[i] ?? null, 'TRY'));
}

/** Alan metinleri → değerler (boş alan null = girilmemiş). */
export function inputsToMonths(inputs: readonly string[]): (number | null)[] {
  return Array.from({ length: 12 }, (_, i) => parseAmountInput(inputs[i] ?? ''));
}

/** Değişen aylar (1–12) ve yeni değerleri; null hücreyi temizler. */
export function changedMonths(
  original: readonly (number | null)[],
  next: readonly (number | null)[],
): { month: number; amount: number | null }[] {
  const changes: { month: number; amount: number | null }[] = [];
  for (let i = 0; i < 12; i++) {
    const before = original[i] ?? null;
    const after = next[i] ?? null;
    if (before !== after) changes.push({ month: i + 1, amount: after });
  }
  return changes;
}

/** "Tümüne Ocak tutarını uygula": Ocak boşsa değişiklik yok. */
export function applyFirstToAll(inputs: readonly string[]): string[] {
  const first = inputs[0] ?? '';
  if (!first) return [...inputs];
  return Array<string>(12).fill(first);
}
