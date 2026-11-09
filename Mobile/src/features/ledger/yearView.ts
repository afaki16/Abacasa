// Yıllık tablonun "seçilen ayın dökümü" görünümü için saf yardımcılar (tasarım: Yıllık tablo).
// Toplamlar backend'den gelir (saklanmaz, kayıtlardan hesaplanır); burada yalnızca gruplama ve sıralama yapılır.

import { t } from '@/lib/i18n';

import type { LedgerRow, LedgerYear } from './types';

/** Gelirler · Giderler: sabit ödemeler · Giderler: harcamalar (kategori + plan dışı bağış) · Giderler: elle. */
export type LedgerSectionKey = 'income' | 'plan' | 'spending' | 'manual';

export interface MonthLine {
  key: string;
  row: LedgerRow;
  /** null: o ay için girilmemiş (yalnızca elle kalemlerde görünür). */
  amount: number | null;
  /** Elle kalem: hücresi düzenlenebilir. */
  editable: boolean;
}

export interface MonthSection {
  key: LedgerSectionKey;
  total: number;
  /** Her zaman görünen satırlar (tutara göre büyükten küçüğe). */
  lines: MonthLine[];
  /** "Diğer N kalem" altında toplanan satırlar; dokununca açılır. */
  rest: MonthLine[];
  restTotal: number;
}

const sum = (lines: MonthLine[]) => lines.reduce((acc, l) => acc + (l.amount ?? 0), 0);

function sectionOf(row: LedgerRow, side: 'income' | 'expense'): LedgerSectionKey {
  if (side === 'income') return 'income';
  if (row.source === 'plan') return 'plan';
  if (row.source === 'manual') return 'manual';
  return 'spending';
}

/**
 * Seçilen ayın bölümleri. Otomatik satırlar yalnızca o ay tutarı varsa listelenir; elle kalemler (gelir ve
 * elle gider) tutarı girilmemiş olsa da listelenir ki hücresi doldurulabilsin. Gelirler bölümü boş da olsa
 * döner (yeni kalem eklemenin yeri); diğer bölümler satırı yoksa atlanır.
 * visibleLimit'ten fazla satır varsa ilk visibleLimit görünür, kalanı "Diğer N" altında toplanır.
 */
export function buildMonthSections(
  data: LedgerYear,
  month: number,
  visibleLimit = 3,
): MonthSection[] {
  const index = month - 1;
  const buckets: Record<LedgerSectionKey, MonthLine[]> = {
    income: [],
    plan: [],
    spending: [],
    manual: [],
  };

  const add = (row: LedgerRow, side: 'income' | 'expense') => {
    const amount = row.months[index] ?? null;
    const editable = row.source === 'manual';
    if (!editable && !amount) return;
    buckets[sectionOf(row, side)].push({ key: row.key, row, amount, editable });
  };
  data.incomeRows.forEach((r) => add(r, 'income'));
  data.expenseRows.forEach((r) => add(r, 'expense'));

  const order: LedgerSectionKey[] = ['income', 'plan', 'spending', 'manual'];
  return order
    .filter((key) => key === 'income' || buckets[key].length > 0)
    .map((key) => {
      // Kararlı sıralama: tutar büyükten küçüğe, girilmemişler sonda.
      const sorted = [...buckets[key]].sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1));
      const collapse = sorted.length > visibleLimit + 1;
      const lines = collapse ? sorted.slice(0, visibleLimit) : sorted;
      const rest = collapse ? sorted.slice(visibleLimit) : [];
      return { key, total: sum(sorted), lines, rest, restTotal: sum(rest) };
    });
}

/**
 * Satır adı: elle kalemde sahibi de yazılır ("Maaş · Ahmet"). Plan dışı bağış satırının adı backend'den
 * Türkçe gelir; dile göre çeviriden alınır (web: ledger.rows.donations).
 */
export function lineName(row: LedgerRow): string {
  if (row.source === 'donations') return t('ledger.rows.donations');
  return row.ownerName ? `${row.name} · ${row.ownerName}` : row.name;
}

/** Yıl açılınca seçilen ay: bu yıl ise bugünün ayı, geçmiş yıl Aralık, gelecek yıl Ocak. */
export function defaultMonth(year: number, today: string): number {
  const [y, m] = today.split('-').map(Number);
  if (year === y) return m;
  return year < y ? 12 : 1;
}

/** Ay şeridi için kısa net: "+12,4" (bin) / "+1,2" (milyon); veri yoksa null. */
export function compactNet(
  value: number,
  hasData: boolean,
): { text: string; unit: 'k' | 'm' } | null {
  if (!hasData) return null;
  const abs = Math.abs(value);
  const unit = abs >= 1_000_000 ? 'm' : 'k';
  const scaled = abs / (unit === 'm' ? 1_000_000 : 1_000);
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return { text: `${sign}${scaled.toFixed(1).replace('.', ',')}`, unit };
}

/** Ayda herhangi bir gelir ya da gider tutarı var mı (ay şeridinde "—" yerine net gösterilir). */
export function monthHasData(data: LedgerYear, month: number): boolean {
  const i = month - 1;
  return data.totals.incomeByMonth[i] !== 0 || data.totals.expenseByMonth[i] !== 0;
}

/** Elle kalemin bu yıldaki 12 aylık değeri (yıl tablosundaki satırından); satır yoksa hepsi null. */
export function manualItemMonths(data: LedgerYear | undefined, itemId: number): (number | null)[] {
  const row = [...(data?.incomeRows ?? []), ...(data?.expenseRows ?? [])].find(
    (r) => r.source === 'manual' && r.id === itemId,
  );
  return row ? [...row.months] : Array<number | null>(12).fill(null);
}
