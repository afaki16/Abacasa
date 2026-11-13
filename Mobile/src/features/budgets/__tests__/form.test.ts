import { budgetFormSchema, budgetFormToRequest, budgetToForm, usageShare, usageTone } from '../form';

describe('bütçe', () => {
  it('kullanım tonu: %80 altı normal, %100’e kadar uyarı, üstü aşıldı', () => {
    expect(usageTone(0)).toBe('normal');
    expect(usageTone(79.9)).toBe('normal');
    expect(usageTone(80)).toBe('warning');
    expect(usageTone(100)).toBe('warning');
    expect(usageTone(100.1)).toBe('over');
  });

  it('çubuk 0–1 arasında kalır', () => {
    expect(usageShare(45)).toBe(0.45);
    expect(usageShare(140)).toBe(1);
    expect(usageShare(-5)).toBe(0);
    expect(usageShare(Number.NaN)).toBe(0);
  });

  it('yeni kayıt seçili aydan başlar, hane varsayılan', () => {
    expect(budgetToForm(undefined, 2026, 11)).toEqual({
      ownerPersonId: null,
      startYear: 2026,
      startMonth: 11,
      amount: '',
      note: '',
    });
  });

  it('0 tutar geçerli (bütçeyi kaldırır), boş tutar ve aralık dışı yıl geçersiz', () => {
    const base = budgetToForm(undefined, 2026, 11);
    expect(budgetFormSchema.safeParse({ ...base, amount: '0' }).success).toBe(true);
    expect(budgetFormSchema.safeParse({ ...base, amount: '' }).success).toBe(false);
    expect(budgetFormSchema.safeParse({ ...base, amount: '100', startYear: 1999 }).success).toBe(false);
  });

  it('isteğe çevirme: not kırpılır, boş not null', () => {
    expect(
      budgetFormToRequest({ ownerPersonId: 3, startYear: 2026, startMonth: 11, amount: '15000', note: '  ' }),
    ).toEqual({ ownerPersonId: 3, startYear: 2026, startMonth: 11, amount: 15000, note: null });
  });
});
