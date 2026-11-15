import { donationFormToRequest, donationInTry, donationToForm, emptyDonationForm } from '../donationForm';
import type { DonationListItem } from '../types';

describe('bağış formu: döviz', () => {
  const base = { ...emptyDonationForm('2026-11-14'), kind: 'Donation' as const, recipient: 'Test Dernek', paymentMethodId: 5 };

  it('TL bağışta tutar olduğu gibi gider, döviz alanları boş', () => {
    expect(donationFormToRequest({ ...base, amount: '1500,50' })).toMatchObject({
      amount: 1500.5,
      currency: 'TRY',
      foreignAmount: null,
      exchangeRate: null,
    });
  });

  it('dövizde TL karşılığı tutar × kur, emanet gönderilmez', () => {
    expect(
      donationFormToRequest({ ...base, currency: 'USD', amount: '100', rate: '41,8523', useFund: true, fundId: 9 }),
    ).toMatchObject({ amount: 4185.23, currency: 'USD', foreignAmount: 100, exchangeRate: 41.8523, fundId: null });
  });

  it('TL karşılığı önizlemesi kuruşa yuvarlanır; eksik değerde null', () => {
    expect(donationInTry('3', '4250,333')).toBe(12751);
    expect(donationInTry('', '41')).toBeNull();
  });

  it('kayıttan forma: dövizde birim tutarı ve kur gelir', () => {
    const donation = {
      id: 1,
      date: '2026-11-10',
      amount: 4185.23,
      currency: 'USD',
      foreignAmount: 100,
      exchangeRate: 41.8523,
      kind: 'Donation',
      recipient: 'Test',
      giverPersonId: null,
      giverPersonName: null,
      paymentMethodId: 5,
      paymentMethodName: 'Nakit',
      paymentMethodType: 'Cash',
      note: null,
      fundId: null,
      fundLabel: null,
      createdDate: '2026-11-10T00:00:00Z',
    } as DonationListItem;
    expect(donationToForm(donation)).toMatchObject({ currency: 'USD', amount: '100,00', rate: '41,8523' });
  });
});
