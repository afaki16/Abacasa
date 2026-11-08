import { buildObligationRequest } from '../obligations';
import type { VehicleObligationFormValues } from '../types';

const form = (patch: Partial<VehicleObligationFormValues> = {}): VehicleObligationFormValues => ({
  type: 'Kasko',
  date: '2026-11-01',
  validUntil: '2027-11-01',
  amount: 12500,
  note: null,
  createExpense: false,
  categoryId: 3,
  paymentMethodId: 4,
  ...patch,
});

describe('buildObligationRequest', () => {
  it('harcama oluşturulmayacaksa kategori ve aracı göndermez', () => {
    const body = buildObligationRequest(form());
    expect(body.createExpense).toBe(false);
    expect(body.categoryId).toBeUndefined();
    expect(body.paymentMethodId).toBeUndefined();
  });

  it('harcama oluşturulacaksa kategori ve aracı gönderir', () => {
    const body = buildObligationRequest(form({ createExpense: true }));
    expect(body).toMatchObject({ createExpense: true, categoryId: 3, paymentMethodId: 4 });
  });

  it('bağlı harcaması olan işlemde createExpense göndermez', () => {
    const body = buildObligationRequest(form({ createExpense: true }), { hasExpense: true });
    expect(body.createExpense).toBe(false);
    expect(body.categoryId).toBeUndefined();
  });

  it('boş tutar ve notu göndermez, notu kırpar', () => {
    expect(buildObligationRequest(form({ amount: null, note: '  ' }))).toMatchObject({ amount: undefined, note: undefined });
    expect(buildObligationRequest(form({ note: ' poliçe ' })).note).toBe('poliçe');
    expect(buildObligationRequest(form({ amount: 0 })).amount).toBe(0);
  });
});
