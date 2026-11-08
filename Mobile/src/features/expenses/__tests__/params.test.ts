import { monthRange } from '@/lib/format/period';

import { toExpenseQueryParams } from '../params';

describe('toExpenseQueryParams', () => {
  it('süzgeç yoksa boş nesne döner', () => {
    expect(toExpenseQueryParams()).toEqual({});
    expect(toExpenseQueryParams({})).toEqual({});
  });

  it('dönemi startDate / endDate olarak verir', () => {
    expect(toExpenseQueryParams({ period: monthRange(2026, 2) })).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
  });

  it('arama terimini kırpar; boşsa göndermez', () => {
    expect(toExpenseQueryParams({ searchTerm: '  market ' })).toEqual({ searchTerm: 'market' });
    expect(toExpenseQueryParams({ searchTerm: '   ' })).toEqual({});
  });

  it('kimlik süzgeçlerini olduğu gibi geçirir, tanımsızları atar', () => {
    expect(
      toExpenseQueryParams({ categoryId: 3, paymentMethodId: undefined, ownerPersonId: 7 }),
    ).toEqual({ categoryId: 3, ownerPersonId: 7 });
  });
});
