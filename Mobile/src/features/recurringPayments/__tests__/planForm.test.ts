import {
  choiceFromKind,
  emptyPlanForm,
  installmentAmount,
  kindFromChoice,
  planFormSchema,
  planFormToRequest,
  planToForm,
  type PlanFormValues,
} from '../planForm';
import type { RecurringPaymentListItem } from '../types';

const base = (patch: Partial<PlanFormValues> = {}): PlanFormValues => ({
  ...emptyPlanForm('2026-11-08'),
  name: 'Kira',
  paymentMethodId: 3,
  categoryId: 2,
  dueDay: 8,
  ...patch,
});

const issues = (v: PlanFormValues) => {
  const r = planFormSchema.safeParse(v);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
};

const plan = (patch: Partial<RecurringPaymentListItem>): RecurringPaymentListItem => ({
  id: 1,
  name: 'Kira',
  kind: 'Bill',
  expectedAmount: 22000,
  dueDay: 8,
  startMonth: '2026-11-01',
  isActive: true,
  paymentMethodId: 3,
  paymentMethodName: 'Banka',
  categoryId: 2,
  categoryName: 'Ev',
  ownerPersonId: null,
  ownerPersonName: null,
  recipient: null,
  donationKind: null,
  totalAmount: null,
  installmentCount: null,
  firstDueDate: null,
  hasPayments: false,
  createdDate: '2026-11-01T00:00:00Z',
  ...patch,
});

describe('plan türü seçimi', () => {
  it('seçimlerden türe ve geri çevirir', () => {
    expect(kindFromChoice('donation', 'installment', 'Subscription')).toBe('Donation');
    expect(kindFromChoice('expense', 'installment', 'Bill')).toBe('Installment');
    expect(kindFromChoice('expense', 'monthly', 'Subscription')).toBe('Subscription');
    for (const kind of ['Subscription', 'Bill', 'Installment', 'Donation'] as const) {
      const c = choiceFromKind(kind);
      expect(kindFromChoice(c.group, c.schedule, c.monthlyKind)).toBe(kind);
    }
  });
});

describe('plan formu doğrulaması', () => {
  it('aylık harcamada vade günü ve kategori ister', () => {
    expect(issues(base())).toEqual({});
    expect(issues(base({ dueDay: null, categoryId: null }))).toMatchObject({
      dueDay: 'validation.required',
      categoryId: 'validation.required',
    });
  });

  it('taksitte toplam, 2–120 taksit ve ilk tarih ister; vade günü istemez', () => {
    const v = base({
      schedule: 'installment',
      dueDay: null,
      totalAmount: '25000',
      installmentCount: '1',
      firstDueDate: null,
    });
    const e = issues(v);
    expect(e.installmentCount).toMatch(/^validation\.range/);
    expect(e.firstDueDate).toBe('validation.required');
    expect(e.dueDay).toBeUndefined();
    expect(issues({ ...v, installmentCount: '12', firstDueDate: '2026-08-03' })).toEqual({});
  });

  it('bağışta alıcı ve bağış türü ister, kategori istemez', () => {
    const e = issues(base({ group: 'donation', categoryId: null }));
    expect(e).toMatchObject({
      recipient: 'validation.required',
      donationKind: 'validation.required',
    });
    expect(e.categoryId).toBeUndefined();
  });

  it('beklenen tutar boş olabilir ama sıfır olamaz', () => {
    expect(issues(base({ expectedAmount: '' }))).toEqual({});
    expect(issues(base({ expectedAmount: '0' })).expectedAmount).toBe('validation.positive');
  });
});

describe('form ↔ istek', () => {
  it('aylık planda taksit alanlarını null, başlangıç ayını ayın 1’i gönderir', () => {
    const r = planFormToRequest(base({ expectedAmount: '1386,2', startYear: 2026, startMonth: 3 }));
    expect(r).toMatchObject({
      kind: 'Bill',
      expectedAmount: 1386.2,
      startMonth: '2026-03-01',
      dueDay: 8,
      totalAmount: null,
      installmentCount: null,
      firstDueDate: null,
      recipient: null,
      donationKind: null,
    });
  });

  it('taksitte vade günü ve başlangıç ayını null gönderir', () => {
    const r = planFormToRequest(
      base({
        schedule: 'installment',
        totalAmount: '25000',
        installmentCount: '12',
        firstDueDate: '2026-08-03',
      }),
    );
    expect(r).toMatchObject({
      kind: 'Installment',
      dueDay: null,
      startMonth: null,
      expectedAmount: null,
      totalAmount: 25000,
      installmentCount: 12,
    });
  });

  it('bağışta kategori null, alıcı kırpılır', () => {
    const r = planFormToRequest(
      base({ group: 'donation', recipient: '  Elif ', donationKind: 'Scholarship' }),
    );
    expect(r).toMatchObject({
      kind: 'Donation',
      categoryId: null,
      recipient: 'Elif',
      donationKind: 'Scholarship',
    });
  });

  it('kayıttan formu kurar', () => {
    const v = planToForm(
      plan({
        kind: 'Installment',
        totalAmount: 25000,
        installmentCount: 12,
        firstDueDate: '2026-08-03',
      }),
      '2026-11-08',
    );
    expect(v).toMatchObject({
      group: 'expense',
      schedule: 'installment',
      totalAmount: '25000,00',
      installmentCount: '12',
      dueDay: null,
    });
    expect(planToForm(plan({}), '2026-11-08')).toMatchObject({
      startYear: 2026,
      startMonth: 11,
      expectedAmount: '22000,00',
    });
  });

  it('aylık taksit önizlemesi', () => {
    expect(installmentAmount(25000, 12)).toBe(2083.33);
    expect(installmentAmount(null, 12)).toBeNull();
  });
});
