import { toBreakdownRows } from '../breakdown';
import { periodLabel, periodShortLabel, resolvePeriod, selectionForToday, shiftSelection } from '../periodSelection';
import type { DashboardUpcomingItem } from '../types';
import { dueInfo, splitUpcoming, upcomingKey } from '../upcoming';

const card = { id: 7, name: 'Bonus', statementDay: 15 };

describe('periodSelection', () => {
  it('takvim ayı: ayın 1’i – son günü', () => {
    expect(resolvePeriod({ year: 2026, month: 2, card: null })).toMatchObject({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('kart dönemi: önceki kesimin ertesi günü – bu ayın kesim günü', () => {
    expect(resolvePeriod({ year: 2026, month: 11, card })).toMatchObject({ start: '2026-10-16', end: '2026-11-15' });
  });

  it('bugünü içeren dönem: kesim günü geçtiyse sonraki ayın dönemi', () => {
    expect(selectionForToday('2026-11-08')).toEqual({ year: 2026, month: 11, card: null });
    expect(selectionForToday('2026-11-08', card)).toEqual({ year: 2026, month: 11, card });
    expect(selectionForToday('2026-11-20', card)).toEqual({ year: 2026, month: 12, card });
  });

  it('yıl sınırında kaydırır, kart korunur', () => {
    expect(shiftSelection({ year: 2026, month: 12, card }, 1)).toEqual({ year: 2027, month: 1, card });
    expect(shiftSelection({ year: 2026, month: 1, card: null }, -1)).toEqual({ year: 2025, month: 12, card: null });
  });

  it('etiketler', () => {
    expect(periodLabel({ year: 2026, month: 11 })).toBe('Kasım 2026');
    expect(periodShortLabel({ year: 2026, month: 11 })).toBe('Kas 2026');
  });
});

describe('toBreakdownRows', () => {
  it('tutara göre azalan sıralar, payı ve yüzdeyi hesaplar', () => {
    const rows = toBreakdownRows([
      { key: 'a', label: 'A', amount: 25 },
      { key: 'b', label: 'B', amount: 75 },
    ]);
    expect(rows.map((r) => r.key)).toEqual(['b', 'a']);
    expect(rows[0]).toMatchObject({ share: 0.75, percent: '75%' });
    expect(rows[1]).toMatchObject({ share: 0.25, percent: '25%' });
  });

  it('%1’in altındaki pozitif pay "<1%"; toplam sıfırsa paylar sıfır', () => {
    expect(toBreakdownRows([
      { key: 'a', label: 'A', amount: 999 },
      { key: 'b', label: 'B', amount: 1 },
    ])[1].percent).toBe('<1%');
    expect(toBreakdownRows([{ key: 'a', label: 'A', amount: 0 }])[0]).toMatchObject({ share: 0, percent: '0%' });
    expect(toBreakdownRows([])).toEqual([]);
  });
});

const item = (over: Partial<DashboardUpcomingItem>): DashboardUpcomingItem => ({
  source: 'recurring',
  recurringPaymentId: 1,
  vehicleId: null,
  name: 'Kira',
  kind: 'Bill',
  obligationType: null,
  dueDate: '2026-11-08',
  amount: 100,
  isEstimated: false,
  paymentMethodName: 'Nakit',
  isOverdue: false,
  ...over,
});

describe('upcoming', () => {
  it('vade durumu: gecikti / bugün / yakın / uzak', () => {
    expect(dueInfo(item({ dueDate: '2026-11-06', isOverdue: true }), '2026-11-08')).toEqual({ tone: 'overdue', days: 2 });
    expect(dueInfo(item({ dueDate: '2026-11-08' }), '2026-11-08')).toEqual({ tone: 'today', days: 0 });
    expect(dueInfo(item({ dueDate: '2026-11-22' }), '2026-11-08')).toEqual({ tone: 'soon', days: 14 });
    expect(dueInfo(item({ dueDate: '2026-11-23' }), '2026-11-08')).toEqual({ tone: 'later', days: 15 });
  });

  it('sabit ödeme ve araç satırlarını ayırır, sırayı korur', () => {
    const a = item({ recurringPaymentId: 1 });
    const v = item({ source: 'vehicle', recurringPaymentId: null, vehicleId: 3, obligationType: 'Inspection' });
    const b = item({ recurringPaymentId: 2 });
    expect(splitUpcoming([a, v, b])).toEqual({ recurring: [a, b], vehicles: [v] });
    expect(upcomingKey(v)).toBe('vehicle-3-Inspection-2026-11-08');
  });
});
