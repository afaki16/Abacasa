// Backend sayfalı liste sözleşmesi (PagedResult<T>) ve TanStack infinite query yardımcıları.

/** Örn. GET /api/Users?page=1&pageSize=20 → { items, totalCount, totalPages, pageNumber } */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
}

export const DEFAULT_PAGE_SIZE = 20;

/** useInfiniteQuery için: sonraki sayfa numarası ya da bitti. */
export function getNextPage<T>(last: PagedResult<T>): number | undefined {
  return last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined;
}

/** Sayfaları tek listeye düzleştirir (FlashList data). */
export function flattenPages<T>(pages: PagedResult<T>[] | undefined): T[] {
  return pages?.flatMap((p) => p.items) ?? [];
}
