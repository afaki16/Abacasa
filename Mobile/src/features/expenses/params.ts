// Harcama süzgeçlerinin sorgu parametrelerine çevrilmesi (liste ve özet ortak). Saf; testlidir.

import type { ExpenseFilters } from './types';

export interface ExpenseQueryParams {
  [key: string]: string | number | undefined;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  paymentMethodId?: number;
  ownerPersonId?: number;
}

/** Boş değerler gönderilmez (web'deki appendFilters ile aynı). */
export function toExpenseQueryParams({
  searchTerm,
  period,
  categoryId,
  paymentMethodId,
  ownerPersonId,
}: ExpenseFilters = {}): ExpenseQueryParams {
  const params: ExpenseQueryParams = {};
  const term = searchTerm?.trim();
  if (term) params.searchTerm = term;
  if (period) {
    params.startDate = period.start;
    params.endDate = period.end;
  }
  if (categoryId != null) params.categoryId = categoryId;
  if (paymentMethodId != null) params.paymentMethodId = paymentMethodId;
  if (ownerPersonId != null) params.ownerPersonId = ownerPersonId;
  return params;
}
