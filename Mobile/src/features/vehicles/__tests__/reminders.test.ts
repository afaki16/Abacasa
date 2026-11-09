import {
  addYears,
  currentObligationIds,
  dueTone,
  filterObligations,
  obligationDue,
  obligationYearTotal,
  vehicleBadge,
} from '../reminders';
import type { VehicleObligation } from '../types';

const ob = (
  partial: Partial<VehicleObligation> &
    Pick<VehicleObligation, 'id' | 'type' | 'date' | 'validUntil'>,
): VehicleObligation => ({
  vehicleId: 1,
  amount: null,
  note: null,
  expenseId: null,
  hasExpense: false,
  createdDate: '2026-01-01T00:00:00Z',
  ...partial,
});

const TODAY = '2026-11-08';

describe('vehicleBadge', () => {
  it('pasif araçta hatırlatma yok', () => {
    expect(
      vehicleBadge(
        { isActive: false, current: [{ type: 'Mtv', validUntil: '2026-11-01', lastAmount: null }] },
        TODAY,
      ),
    ).toEqual({
      kind: 'inactive',
    });
  });

  it('güncel kaydı yoksa none', () => {
    expect(vehicleBadge({ isActive: true, current: [] }, TODAY)).toEqual({ kind: 'none' });
  });

  it('en yakın geçerlilik sonunu seçer: 12 gün kaldı (yaklaşıyor), gecikmiş, uzak', () => {
    const current = [
      { type: 'Kasko' as const, validUntil: '2027-03-10', lastAmount: 18900 },
      { type: 'Inspection' as const, validUntil: '2026-11-20', lastAmount: 1850 },
    ];
    expect(vehicleBadge({ isActive: true, current }, TODAY)).toEqual({
      kind: 'due',
      type: 'Inspection',
      daysLeft: 12,
      tone: 'pending',
    });
    expect(
      vehicleBadge(
        { isActive: true, current: [{ type: 'Mtv', validUntil: '2026-11-05', lastAmount: null }] },
        TODAY,
      ),
    ).toEqual({ kind: 'due', type: 'Mtv', daysLeft: -3, tone: 'overdue' });
    expect(vehicleBadge({ isActive: true, current: [current[0]] }, TODAY)).toEqual({
      kind: 'next',
      type: 'Kasko',
      validUntil: '2027-03-10',
    });
  });
});

describe('işlemler', () => {
  const list = [
    ob({ id: 1, type: 'Inspection', date: '2024-11-20', validUntil: '2026-11-20', amount: 1850 }),
    ob({ id: 2, type: 'Inspection', date: '2022-11-20', validUntil: '2024-11-20', amount: 900 }),
    ob({
      id: 3,
      type: 'TrafficInsurance',
      date: '2025-12-06',
      validUntil: '2026-12-06',
      amount: 14200,
    }),
    ob({ id: 4, type: 'Kasko', date: '2026-03-10', validUntil: '2027-03-10', amount: 18900 }),
    ob({ id: 5, type: 'Mtv', date: '2026-07-15', validUntil: '2027-01-31' }),
  ];

  it('her tür için güncel işlem geçerlilik sonu en geç olandır', () => {
    expect([...currentObligationIds(list)].sort()).toEqual([1, 3, 4, 5]);
  });

  it('rozet yalnızca güncel işlemde ve 30 gün penceresinde', () => {
    expect(obligationDue(list[0], true, true, TODAY)).toEqual({ daysLeft: 12, tone: 'pending' });
    expect(obligationDue(list[2], true, true, TODAY)).toEqual({ daysLeft: 28, tone: 'neutral' });
    expect(obligationDue(list[3], true, true, TODAY)).toBeNull();
    expect(obligationDue(list[1], false, true, TODAY)).toBeNull();
    expect(obligationDue(list[0], true, false, TODAY)).toBeNull();
  });

  it('yıl gideri işlem tarihine göre; tutarsız işlemler 0 sayılır', () => {
    expect(obligationYearTotal(list, 2026)).toBe(18900);
    expect(obligationYearTotal(list, 2025)).toBe(14200);
  });

  it('tür filtresi ve yeniden eskiye sıralama', () => {
    expect(filterObligations(list, null).map((o) => o.id)).toEqual([5, 4, 3, 1, 2]);
    expect(filterObligations(list, 'Inspection').map((o) => o.id)).toEqual([1, 2]);
  });

  it('dueTone sınırları', () => {
    expect(dueTone(-1)).toBe('overdue');
    expect(dueTone(0)).toBe('pending');
    expect(dueTone(15)).toBe('pending');
    expect(dueTone(16)).toBe('neutral');
  });

  it('addYears 29 Şubat → 28 Şubat', () => {
    expect(addYears('2026-12-06', 1)).toBe('2027-12-06');
    expect(addYears('2028-02-29', 1)).toBe('2029-02-28');
  });
});
