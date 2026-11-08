import { flattenPages, getNextPage, type PagedResult } from '../paging';

const page = (pageNumber: number, totalPages: number, items: number[]): PagedResult<number> => ({
  items,
  pageNumber,
  totalPages,
  totalCount: items.length,
});

describe('paging', () => {
  it('son sayfaya kadar sonraki sayfa numarasını verir', () => {
    expect(getNextPage(page(1, 3, [1]))).toBe(2);
    expect(getNextPage(page(3, 3, [1]))).toBeUndefined();
    expect(getNextPage(page(1, 0, []))).toBeUndefined();
  });

  it('sayfaları tek listeye düzleştirir', () => {
    expect(flattenPages([page(1, 2, [1, 2]), page(2, 2, [3])])).toEqual([1, 2, 3]);
    expect(flattenPages(undefined)).toEqual([]);
  });
});
