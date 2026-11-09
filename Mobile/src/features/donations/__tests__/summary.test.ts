import i18n from '@/lib/i18n';

import {
  donationFormSchema,
  donationFormToRequest,
  donationToForm,
  emptyDonationForm,
} from '../donationForm';
import {
  donationMeta,
  giverBreakdown,
  kindBreakdown,
  percentText,
  yearOptions,
  yearPeriod,
} from '../summary';
import type { DonationListItem } from '../types';

beforeAll(async () => {
  await i18n.changeLanguage('tr');
});

describe('bağış özeti', () => {
  const summary = {
    total: 25000,
    byKind: [
      { kind: 'Zakat' as const, total: 12000, count: 2 },
      { kind: 'Scholarship' as const, total: 13000, count: 5 },
      { kind: 'Donation' as const, total: 0, count: 0 },
    ],
    byGiver: [
      { personId: null, personName: null, total: 5000, count: 1 },
      { personId: 4, personName: 'Ayşe', total: 20000, count: 6 },
    ],
  };

  it('türe göre büyükten küçüğe, boş tür yok, pay oranı', () => {
    const rows = kindBreakdown(summary);
    expect(rows.map((r) => r.key)).toEqual(['Scholarship', 'Zakat']);
    expect(rows[0].label).toBe('Burs');
    expect(rows[1].share).toBeCloseTo(0.48);
    expect(percentText(rows[1].share)).toBe('%48');
  });

  it('verene göre; kişisiz bağış hanenin', () => {
    const rows = giverBreakdown(summary, 'Hane');
    expect(rows.map((r) => r.label)).toEqual(['Ayşe', 'Hane']);
  });

  it('toplam sıfırsa pay sıfır', () => {
    expect(
      kindBreakdown({ total: 0, byKind: [{ kind: 'Zakat', total: 0, count: 1 }] })[0].share,
    ).toBe(0);
  });

  it('yıl aralığı ve seçenekleri', () => {
    expect(yearPeriod(2026)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
    expect(yearOptions(2026, 2)).toEqual([2027, 2026, 2025, 2024]);
  });

  it('satır metni; emanetten işaretlenir', () => {
    const d = { date: '2026-11-05', giverPersonName: 'Ayşe', recipient: 'Elif Kaya', fundId: null };
    expect(donationMeta(d, 'Hane')).toBe('5 Kas · Ayşe → Elif Kaya');
    expect(donationMeta({ ...d, giverPersonName: null, fundId: 3 }, 'Hane')).toBe(
      '5 Kas · Hane → Elif Kaya · Emanetten',
    );
  });
});

describe('bağış formu', () => {
  const issues = (v: ReturnType<typeof emptyDonationForm>) => {
    const r = donationFormSchema.safeParse(v);
    return r.success
      ? {}
      : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
  };

  it('zorunlu alanlar ve emanet seçimi', () => {
    const e = issues({ ...emptyDonationForm('2026-11-08'), useFund: true });
    expect(e).toMatchObject({
      amount: 'validation.required',
      kind: 'validation.required',
      recipient: 'validation.required',
      paymentMethodId: 'validation.required',
      fundId: 'validation.required',
    });
  });

  it('emanetten açılınca tür emanetinkidir; emanet kapalıysa fundId gönderilmez', () => {
    const v = {
      ...emptyDonationForm('2026-11-08', { id: 9, kind: 'Zakat' }),
      amount: '1500',
      recipient: ' Dernek ',
      paymentMethodId: 2,
    };
    expect(v.kind).toBe('Zakat');
    expect(issues(v)).toEqual({});
    expect(donationFormToRequest(v)).toMatchObject({
      amount: 1500,
      recipient: 'Dernek',
      fundId: 9,
      note: null,
      giverPersonId: null,
    });
    expect(donationFormToRequest({ ...v, useFund: false }).fundId).toBeNull();
  });

  it('kayıttan formu kurar', () => {
    const d = {
      amount: 100,
      date: '2026-10-12',
      kind: 'Donation',
      recipient: 'X',
      giverPersonId: 1,
      paymentMethodId: 2,
      note: null,
      fundId: 5,
    } as DonationListItem;
    expect(donationToForm(d)).toMatchObject({
      amount: '100,00',
      useFund: true,
      fundId: 5,
      note: '',
    });
  });
});
