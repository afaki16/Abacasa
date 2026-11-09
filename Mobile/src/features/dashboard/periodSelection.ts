// Dönem seçimi (takvim ayı ya da kredi kartı dönemi) — Özet, Harcamalar ve Kategoriye göre ekranları ortak.
// Web'deki Budget/PeriodSelector ile aynı kurallar. Saf; testlidir.

import {
  addMonths,
  currentStatementPeriod,
  monthName,
  monthRange,
  monthShortName,
  statementPeriod,
  type Period,
} from '@/lib/format/period';

/** Kart dönemi için seçilen kredi kartı (kesim günü olan). */
export interface StatementCard {
  id: number;
  name: string;
  statementDay: number;
}

export interface PeriodSelection {
  /** Dönemin adlandırıldığı yıl/ay (kart döneminde kesim tarihinin ayı). */
  year: number;
  month: number;
  /** Boşsa takvim ayı. */
  card: StatementCard | null;
}

/** Seçimin tarih aralığı. */
export function resolvePeriod({ year, month, card }: PeriodSelection): Period {
  return card ? statementPeriod(year, month, card.statementDay) : monthRange(year, month);
}

/** Bugünü içeren dönem (karta göre). */
export function selectionForToday(today: string, card: StatementCard | null = null): PeriodSelection {
  if (card) {
    const p = currentStatementPeriod(today, card.statementDay);
    return { year: p.year, month: p.month, card };
  }
  const [year, month] = today.split('-').map(Number);
  return { year, month, card: null };
}

/** Önceki / sonraki dönem. */
export function shiftSelection(selection: PeriodSelection, n: number): PeriodSelection {
  const next = addMonths(selection.year, selection.month, n);
  return { ...selection, ...next };
}

/** "Kasım 2026". */
export function periodLabel({ year, month }: Pick<PeriodSelection, 'year' | 'month'>): string {
  return `${monthName(month)} ${year}`;
}

/** "Kas 2026" (Harcamalar araç çubuğu). */
export function periodShortLabel({ year, month }: Pick<PeriodSelection, 'year' | 'month'>): string {
  return `${monthShortName(month)} ${year}`;
}
