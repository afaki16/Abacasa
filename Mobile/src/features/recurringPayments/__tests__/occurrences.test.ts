import { buildRecurringPaymentListQuery, getLinkedRecord, occurrenceKey, undoPermission } from '../occurrences';

const occ = (patch: Partial<{ isPaid: boolean; expenseId: number | null; donationId: number | null }>) => ({
  isPaid: true,
  expenseId: null,
  donationId: null,
  ...patch,
});

describe('vade yardımcıları', () => {
  it('plan + ay anahtarı üretir', () => {
    expect(occurrenceKey({ recurringPaymentId: 7, month: '2026-11-01' })).toBe('7-2026-11-01');
  });

  it('ödenmiş vadenin bağlı kaydını bulur', () => {
    expect(getLinkedRecord(occ({ expenseId: 12 }))).toEqual({ type: 'expense', id: 12 });
    expect(getLinkedRecord(occ({ donationId: 5 }))).toEqual({ type: 'donation', id: 5 });
  });

  it('ödenmemiş ya da kaydı olmayan vadede null döner', () => {
    expect(getLinkedRecord(occ({ isPaid: false, expenseId: 12 }))).toBeNull();
    expect(getLinkedRecord(occ({}))).toBeNull();
  });

  it('geri alma iznini kayıt türünden verir', () => {
    expect(undoPermission(occ({ expenseId: 1 }))).toBe('Expenses.Delete');
    expect(undoPermission(occ({ donationId: 1 }))).toBe('Donations.Delete');
    expect(undoPermission(occ({ isPaid: false }))).toBeNull();
  });
});

describe('buildRecurringPaymentListQuery', () => {
  it('boş aramayı göndermez, isActive=false korunur', () => {
    expect(buildRecurringPaymentListQuery(2, 20, { searchTerm: '  ', isActive: false, kind: 'Bill' })).toEqual({
      page: 2,
      pageSize: 20,
      searchTerm: undefined,
      kind: 'Bill',
      isActive: false,
    });
  });

  it('aramayı kırpar', () => {
    expect(buildRecurringPaymentListQuery(1, 20, { searchTerm: ' kira ' }).searchTerm).toBe('kira');
  });
});
