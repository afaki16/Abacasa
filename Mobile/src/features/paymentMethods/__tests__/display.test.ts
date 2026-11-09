import { paymentMethodMeta, splitByActive, toPaymentMethodRequest } from '../display';

const labels = {
  shared: 'Ortak',
  statementDay: (d: number) => `Kesim ${d}`,
  mealCardNote: 'Dönem toplamına dahil değil',
};

describe('ödeme aracı yardımcıları', () => {
  it('aktif ve pasifleri ayırır', () => {
    const { active, inactive } = splitByActive([
      { id: 1, isActive: true },
      { id: 2, isActive: false },
      { id: 3, isActive: true },
    ]);
    expect(active.map((m) => m.id)).toEqual([1, 3]);
    expect(inactive.map((m) => m.id)).toEqual([2]);
  });

  it('alt satır: sahip/ortak, banka, kesim günü, yemek kartı notu', () => {
    expect(
      paymentMethodMeta(
        { type: 'CreditCard', bank: 'Garanti', ownerPersonName: 'Ahmet', statementDay: 15 },
        labels,
      ),
    ).toBe('Ahmet · Garanti · Kesim 15');
    expect(
      paymentMethodMeta(
        { type: 'Cash', bank: null, ownerPersonName: null, statementDay: null },
        labels,
      ),
    ).toBe('Ortak');
    expect(
      paymentMethodMeta(
        { type: 'MealCard', bank: null, ownerPersonName: 'Ahmet', statementDay: null },
        labels,
      ),
    ).toBe('Ahmet · Dönem toplamına dahil değil');
  });

  it('istek: kesim günü yalnızca kredi kartında, nakitte banka yok', () => {
    const base = {
      name: ' Kart ',
      bank: ' Garanti ',
      ownerPersonId: 3,
      statementDay: '15',
      isActive: true,
    };
    expect(toPaymentMethodRequest({ ...base, type: 'CreditCard' })).toEqual({
      name: 'Kart',
      type: 'CreditCard',
      bank: 'Garanti',
      ownerPersonId: 3,
      statementDay: 15,
      isActive: true,
    });
    expect(toPaymentMethodRequest({ ...base, type: 'BankAccount' }).statementDay).toBeNull();
    const cash = toPaymentMethodRequest({ ...base, type: 'Cash' });
    expect(cash.bank).toBeNull();
    expect(cash.statementDay).toBeNull();
    expect(toPaymentMethodRequest({ ...base, type: 'BankAccount', bank: '  ' }).bank).toBeNull();
  });
});
