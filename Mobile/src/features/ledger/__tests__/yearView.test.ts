import type { LedgerRow, LedgerYear } from '../types';
import {
  buildMonthSections,
  compactNet,
  defaultMonth,
  lineName,
  manualItemMonths,
  monthHasData,
} from '../yearView';

const months = (values: Record<number, number | null>): (number | null)[] =>
  Array.from({ length: 12 }, (_, i) => (i + 1 in values ? values[i + 1] : null));

const row = (
  partial: Partial<LedgerRow> & Pick<LedgerRow, 'key' | 'source' | 'name' | 'months'>,
): LedgerRow => ({
  id: null,
  kind: null,
  ownerName: null,
  total: 0,
  monthsWithData: 0,
  average: null,
  ...partial,
});

const zeros = () => Array<number>(12).fill(0);

const year: LedgerYear = {
  year: 2026,
  incomeRows: [
    row({
      key: 'manual-1',
      source: 'manual',
      id: 1,
      name: 'Maaş',
      ownerName: 'Ahmet',
      months: months({ 11: 52000 }),
    }),
    row({ key: 'manual-2', source: 'manual', id: 2, name: 'Kira geliri', months: months({}) }),
  ],
  expenseRows: [
    row({ key: 'plan-1', source: 'plan', id: 10, name: 'Kira', months: months({ 11: 22000 }) }),
    row({ key: 'plan-2', source: 'plan', id: 11, name: 'İnternet', months: months({ 11: 500 }) }),
    row({ key: 'plan-3', source: 'plan', id: 12, name: 'Elektrik', months: months({ 11: 900 }) }),
    row({ key: 'plan-4', source: 'plan', id: 13, name: 'Su', months: months({ 11: 300 }) }),
    row({ key: 'plan-5', source: 'plan', id: 14, name: 'Spor', months: months({ 11: 700 }) }),
    row({
      key: 'category-3',
      source: 'category',
      id: 3,
      name: 'Market',
      months: months({ 11: 12480.2, 10: 9000 }),
    }),
    row({
      key: 'category-4',
      source: 'category',
      id: 4,
      name: 'Yakıt',
      months: months({ 10: 2000 }),
    }),
    row({ key: 'donations', source: 'donations', name: 'Bağışlar', months: months({ 11: 1000 }) }),
    row({ key: 'manual-7', source: 'manual', id: 7, name: 'Aidat', months: months({ 11: 879.6 }) }),
  ],
  totals: {
    incomeByMonth: zeros().map((_, i) => (i === 10 ? 52000 : 0)),
    expenseByMonth: zeros().map((_, i) => (i === 10 ? 38759.8 : i === 9 ? 11000 : 0)),
    netByMonth: zeros().map((_, i) => (i === 10 ? 13240.2 : i === 9 ? -11000 : 0)),
    incomeTotal: 52000,
    expenseTotal: 49759.8,
    netTotal: 2240.2,
    incomeAverage: 0,
    expenseAverage: 0,
    netAverage: 0,
  },
};

describe('buildMonthSections', () => {
  it('satırları bölümlere ayırır, büyükten küçüğe sıralar, fazlasını "Diğer" altında toplar', () => {
    const sections = buildMonthSections(year, 11, 2);
    expect(sections.map((s) => s.key)).toEqual(['income', 'plan', 'spending', 'manual']);

    const plan = sections[1];
    expect(plan.total).toBe(24400);
    expect(plan.lines.map((l) => l.row.name)).toEqual(['Kira', 'Elektrik']);
    expect(plan.rest.map((l) => l.row.name)).toEqual(['Spor', 'İnternet', 'Su']);
    expect(plan.restTotal).toBe(1500);

    // Plan dışı bağış harcamalar bölümünde; o ay tutarı olmayan kategori listelenmez.
    expect(sections[2].lines.map((l) => l.row.name)).toEqual(['Market', 'Bağışlar']);
    expect(sections[2].rest).toEqual([]);
  });

  it('elle kalemler tutarı girilmemiş olsa da düzenlenebilir satır olarak gelir', () => {
    const income = buildMonthSections(year, 11)[0];
    expect(income.lines.map((l) => [l.row.name, l.amount, l.editable])).toEqual([
      ['Maaş', 52000, true],
      ['Kira geliri', null, true],
    ]);
    expect(income.total).toBe(52000);
  });

  it('gelir bölümü boş da olsa döner; boş gider bölümleri atlanır', () => {
    const empty: LedgerYear = { ...year, incomeRows: [], expenseRows: [year.expenseRows[6]] };
    const sections = buildMonthSections(empty, 11);
    expect(sections.map((s) => s.key)).toEqual(['income']);
    expect(sections[0].lines).toEqual([]);
  });

  it('yalnızca bir satır fazlaysa toplamaz (tek kalemlik "Diğer" olmaz)', () => {
    const sections = buildMonthSections(year, 11, 4);
    expect(sections[1].lines).toHaveLength(5);
    expect(sections[1].rest).toEqual([]);
  });
});

describe('yardımcılar', () => {
  it('lineName sahibi ekler', () => {
    expect(lineName(year.incomeRows[0])).toBe('Maaş · Ahmet');
    expect(lineName(year.incomeRows[1])).toBe('Kira geliri');
  });

  it('defaultMonth: bu yıl bugünün ayı, geçmiş Aralık, gelecek Ocak', () => {
    expect(defaultMonth(2026, '2026-11-08')).toBe(11);
    expect(defaultMonth(2025, '2026-11-08')).toBe(12);
    expect(defaultMonth(2027, '2026-11-08')).toBe(1);
  });

  it('compactNet bin/milyon ve işaret', () => {
    expect(compactNet(12400, true)).toEqual({ text: '+12,4', unit: 'k' });
    expect(compactNet(-2400, true)).toEqual({ text: '−2,4', unit: 'k' });
    expect(compactNet(1_250_000, true)).toEqual({ text: '+1,3', unit: 'm' });
    expect(compactNet(0, true)).toEqual({ text: '0,0', unit: 'k' });
    expect(compactNet(500, false)).toBeNull();
  });

  it('monthHasData gelir ya da gider varsa doğru', () => {
    expect(monthHasData(year, 11)).toBe(true);
    expect(monthHasData(year, 10)).toBe(true);
    expect(monthHasData(year, 12)).toBe(false);
  });

  it('manualItemMonths kalemin satırını bulur; yoksa 12 boş ay', () => {
    expect(manualItemMonths(year, 7)[10]).toBe(879.6);
    expect(manualItemMonths(year, 99)).toEqual(Array(12).fill(null));
    expect(manualItemMonths(undefined, 1)).toHaveLength(12);
  });
});
