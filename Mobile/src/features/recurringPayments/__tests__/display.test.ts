import i18n from '@/lib/i18n';

import {
  countByPaid,
  dueDayText,
  occurrenceAmountText,
  occurrenceMeta,
  occurrenceStatus,
  planAmountText,
  planMeta,
  sortOccurrences,
  trDaySuffix,
} from '../display';
import { splitFieldErrors } from '../formErrors';
import type { RecurringPaymentListItem, RecurringPaymentOccurrence } from '../types';

const occ = (patch: Partial<RecurringPaymentOccurrence>): RecurringPaymentOccurrence => ({
  recurringPaymentId: 1,
  name: 'Kira',
  kind: 'Bill',
  month: '2026-11-01',
  dueDate: '2026-11-08',
  installmentNo: null,
  installmentCount: null,
  paymentMethodId: 1,
  paymentMethodName: 'Banka',
  categoryName: null,
  personName: null,
  recipient: null,
  isPaid: false,
  paidAmount: null,
  paidDate: null,
  expenseId: null,
  donationId: null,
  amount: 22000,
  isEstimated: false,
  ...patch,
});

const TODAY = '2026-11-08';

beforeAll(async () => {
  await i18n.changeLanguage('tr');
});

describe('vade durumu ve metni', () => {
  it('ödendi / gecikti / bekliyor', () => {
    expect(occurrenceStatus(occ({ isPaid: true, dueDate: '2026-11-01' }), TODAY)).toBe('paid');
    expect(occurrenceStatus(occ({ dueDate: '2026-11-06' }), TODAY)).toBe('overdue');
    expect(occurrenceStatus(occ({ dueDate: TODAY }), TODAY)).toBe('pending');
  });

  it('meta satırı', () => {
    expect(occurrenceMeta(occ({ dueDate: '2026-11-06' }), TODAY)).toBe(
      'Vade 6 Kas · 2 gün gecikti',
    );
    expect(occurrenceMeta(occ({}), TODAY)).toBe('Vade bugün · 8 Kas');
    expect(occurrenceMeta(occ({ dueDate: '2026-11-12', amount: null }), TODAY)).toBe(
      'Vade 12 Kas · Tutar belli değil',
    );
    expect(
      occurrenceMeta(
        occ({ isPaid: true, paidDate: '2026-11-03', installmentNo: 4, installmentCount: 12 }),
        TODAY,
      ),
    ).toBe('4 / 12 taksit · Ödendi 3 Kas');
  });

  it('tutar metni', () => {
    expect(occurrenceAmountText(occ({ amount: null }))).toBe('—');
    expect(occurrenceAmountText(occ({ amount: 1200, isEstimated: true }))).toBe('≈ ₺1.200,00');
    expect(occurrenceAmountText(occ({ isPaid: true, paidAmount: 1386.2 }))).toBe('₺1.386,20');
  });

  it('bekleyenler önce, vadeye göre', () => {
    const sorted = sortOccurrences([
      occ({ name: 'A', isPaid: true, dueDate: '2026-11-01' }),
      occ({ name: 'B', dueDate: '2026-11-12' }),
      occ({ name: 'C', dueDate: '2026-11-06' }),
    ]);
    expect(sorted.map((o) => o.name)).toEqual(['C', 'B', 'A']);
    expect(countByPaid(sorted)).toEqual({ paid: 1, pending: 2 });
  });
});

describe('plan metni', () => {
  const plan = (patch: Partial<RecurringPaymentListItem>) =>
    ({
      kind: 'Bill',
      expectedAmount: 22000,
      dueDay: 8,
      totalAmount: null,
      installmentCount: null,
      ...patch,
    }) as RecurringPaymentListItem;

  it('Türkçe gün eki', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 31].map(trDaySuffix)).toEqual([
      'i',
      'si',
      'ü',
      'ü',
      'i',
      'sı',
      'si',
      'i',
      'u',
      'u',
      'i',
      'si',
      'u',
      'i',
    ]);
    expect(dueDayText(6)).toBe('her ayın 6’sı');
  });

  it('aylık, taksitli ve bağış planı', () => {
    expect(planMeta(plan({}))).toBe('Aylık · her ayın 8’i');
    expect(planMeta(plan({ expectedAmount: null }))).toBe('Aylık · tutar değişken');
    expect(planMeta(plan({ kind: 'Installment', installmentCount: 12 }))).toBe(
      'Taksitli · 12 taksit',
    );
    expect(planMeta(plan({ kind: 'Donation', dueDay: 15 }))).toBe('Bağış · Aylık · her ayın 15’i');
    expect(
      planAmountText(plan({ kind: 'Installment', totalAmount: 25000, installmentCount: 12 })),
    ).toBe('₺2.083,33');
    expect(planAmountText(plan({ expectedAmount: null }))).toBe('—');
  });

  it('İngilizce sıra sayısı', async () => {
    await i18n.changeLanguage('en');
    expect(dueDayText(1)).toBe('every month on the 1st');
    expect(dueDayText(12)).toBe('every month on the 12th');
    expect(dueDayText(22)).toBe('every month on the 22nd');
    await i18n.changeLanguage('tr');
  });
});

describe('sunucu alan hataları', () => {
  it('alan adlarını büyük/küçük harf ve yol öneki yok sayarak eşler', () => {
    const r = splitFieldErrors(
      {
        message: 'x',
        fieldErrors: { Amount: ['Tutar hatalı'], 'request.Date': ['Tarih'], Other: ['Genel'] },
      },
      ['amount', 'date'] as const,
    );
    expect(r.fields).toEqual({ amount: 'Tutar hatalı', date: 'Tarih' });
    expect(r.rest).toEqual(['Genel']);
  });

  it('alan hatası yoksa genel mesaj döner; takma ad desteklenir', () => {
    expect(
      splitFieldErrors({ message: 'Kullanımda', fieldErrors: {} }, ['amount'] as const).rest,
    ).toEqual(['Kullanımda']);
    expect(
      splitFieldErrors({ message: '', fieldErrors: { Kind: ['x'] } }, ['group'] as const, {
        kind: 'group',
      }).fields,
    ).toEqual({
      group: 'x',
    });
    expect(splitFieldErrors(null, ['a'] as const)).toEqual({ fields: {}, rest: [] });
  });
});
