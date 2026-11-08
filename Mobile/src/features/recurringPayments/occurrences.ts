// Vade yardımcıları (saf fonksiyonlar). Ödenme durumu saklanmaz; backend bağlı canlı kayıttan hesaplar.

import { LINKED_RECORD_DELETE_PERMISSIONS } from './constants';
import type { LinkedRecord, RecurringPaymentListParams, RecurringPaymentOccurrence } from './types';

/** Liste satırı için benzersiz anahtar (plan + ay). */
export function occurrenceKey(occurrence: Pick<RecurringPaymentOccurrence, 'recurringPaymentId' | 'month'>): string {
  return `${occurrence.recurringPaymentId}-${occurrence.month}`;
}

/** Ödenmiş vadenin bağlı kaydı (bağış planında bağış, diğerlerinde harcama); yoksa null. */
export function getLinkedRecord(
  occurrence: Pick<RecurringPaymentOccurrence, 'isPaid' | 'expenseId' | 'donationId'>,
): LinkedRecord | null {
  if (!occurrence.isPaid) return null;
  if (occurrence.donationId != null) return { type: 'donation', id: occurrence.donationId };
  if (occurrence.expenseId != null) return { type: 'expense', id: occurrence.expenseId };
  return null;
}

/** Geri alma için gereken silme izni; geri alınamıyorsa null. */
export function undoPermission(
  occurrence: Pick<RecurringPaymentOccurrence, 'isPaid' | 'expenseId' | 'donationId'>,
): string | null {
  const record = getLinkedRecord(occurrence);
  return record ? LINKED_RECORD_DELETE_PERMISSIONS[record.type] : null;
}

/** Liste sorgu parametreleri; boş arama gönderilmez, isActive=false korunur. */
export function buildRecurringPaymentListQuery(page: number, pageSize: number, params: RecurringPaymentListParams) {
  return {
    page,
    pageSize,
    searchTerm: params.searchTerm?.trim() || undefined,
    kind: params.kind,
    isActive: params.isActive,
  };
}
