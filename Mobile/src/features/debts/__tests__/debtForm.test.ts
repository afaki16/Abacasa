import {
  debtFormSchema,
  debtFormToRequest,
  debtListRows,
  debtProgress,
  debtToForm,
  groupByCreditor,
  paymentFormToRequest,
  paymentInTry,
  paymentToForm,
  rateToInput,
  sanitizeRateInput,
  stepQuarter,
  summaryColumns,
  validatePayment,
} from '../debtForm';
import type { DebtListItem } from '../types';

const debt = (patch: Partial<DebtListItem>): DebtListItem =>
  ({
    id: 1,
    creditorPersonId: 10,
    creditorName: 'Mehmet',
    debtorPersonId: null,
    debtorName: null,
    currency: 'USD',
    amount: 1200,
    date: '2026-08-01',
    note: 'Ev tadilatı',
    paidAmount: 500,
    remaining: 700,
    isClosed: false,
    paymentCount: 3,
    hasPayments: true,
    ...patch,
  }) as DebtListItem;

describe('borç listesi', () => {
  it('alacaklıya göre gruplar, başlık + kart satırları', () => {
    const items = [
      debt({ id: 1 }),
      debt({ id: 2, creditorPersonId: 11, creditorName: 'Fatma' }),
      debt({ id: 3 }),
    ];
    expect(groupByCreditor(items).map((g) => [g.creditorName, g.debts.map((d) => d.id)])).toEqual([
      ['Mehmet', [1, 3]],
      ['Fatma', [2]],
    ]);
    expect(debtListRows(items).map((r) => r.key)).toEqual(['h-10', 'd-1', 'd-3', 'h-11', 'd-2']);
  });

  it('ilerleme ve özet sütunları', () => {
    expect(debtProgress(debt({}))).toBeCloseTo(0.4167, 3);
    const cols = summaryColumns({
      openTry: 29000,
      foreign: [
        { currency: 'USD', open: 1700, rate: null, openInTry: null },
        { currency: 'QuarterGold', open: 3, rate: null, openInTry: null },
      ],
    });
    expect(cols).toEqual({ tryOpen: 29000, goldOpen: 3, fx: [{ currency: 'USD', open: 1700 }] });
  });
});

describe('borç formu', () => {
  it('çeyrek tam sayı, alacaklı zorunlu', () => {
    const v = {
      ...debtToForm(undefined, '2026-11-08'),
      currency: 'QuarterGold' as const,
      amount: '2,5',
    };
    const r = debtFormSchema.safeParse(v);
    const msgs = r.success
      ? {}
      : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
    expect(msgs).toEqual({
      amount: 'validation.wholeNumber',
      creditorPersonId: 'validation.required',
    });
    expect(debtFormToRequest({ ...v, amount: '3', creditorPersonId: 11 })).toMatchObject({
      currency: 'QuarterGold',
      amount: 3,
      debtorPersonId: null,
    });
  });

  it('çeyrek adımı sıfırın altına inmez', () => {
    expect(stepQuarter('', 1)).toBe('1');
    expect(stepQuarter('3', 1)).toBe('4');
    expect(stepQuarter('1', -1)).toBe('');
    expect(stepQuarter('', -1)).toBe('');
  });
});

describe('borç ödemesi', () => {
  const ctx = { currency: 'USD' as const, debtDate: '2026-08-01', maxAmount: 700 };

  it('kur alanı 4 ondalık, nokta virgül sayılır', () => {
    expect(sanitizeRateInput('41.85205')).toBe('41,8520');
    expect(sanitizeRateInput('₺041,8')).toBe('41,8');
    expect(sanitizeRateInput(',5')).toBe('0,5');
    expect(rateToInput(41.852)).toBe('41,8520');
  });

  it('yabancı birimde kur zorunlu; kalanı ve borç tarihini aşamaz', () => {
    const v = paymentToForm(null, 'USD', '2026-11-08', 41.852);
    expect(v.rate).toBe('41,8520');
    expect(validatePayment({ ...v, amount: '200' }, ctx)).toEqual({});
    expect(validatePayment({ ...v, amount: '800' }, ctx).amount).toMatch(
      /^debts\.validation\.exceedsRemaining/,
    );
    expect(validatePayment({ ...v, amount: '200', rate: '' }, ctx).rate).toBe(
      'validation.required',
    );
    expect(validatePayment({ ...v, amount: '200', date: '2026-07-01' }, ctx).date).toBe(
      'debts.validation.beforeDebt',
    );
  });

  it('TL’de kur gönderilmez; TL karşılığı', () => {
    const v = { date: '2026-11-08', amount: '200', rate: '41,852', note: '' };
    expect(validatePayment(v, { ...ctx, currency: 'TRY' })).toEqual({});
    expect(paymentFormToRequest(v, 'TRY').exchangeRate).toBeNull();
    expect(paymentFormToRequest(v, 'USD')).toEqual({
      date: '2026-11-08',
      amount: 200,
      exchangeRate: 41.852,
      note: null,
    });
    expect(paymentInTry('200', '41,852')).toBe(8370.4);
  });
});
