// RecurringPayments uçları (RecurringPaymentsController).
// Yetkiler: RecurringPayments.Read / Create / Update / Delete; vade ödeme RecurringPaymentPayments.Create.
// Geri alma ayrı bir uç değildir: bağlı harcama (Expenses.Delete) ya da bağış (Donations.Delete) silinir.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import { buildRecurringPaymentListQuery } from './occurrences';
import type {
  CreateRecurringPaymentRequest,
  LinkedRecord,
  OccurrenceRange,
  PayRecurringPaymentRequest,
  PayRecurringPaymentResult,
  RecurringPaymentDetail,
  RecurringPaymentListItem,
  RecurringPaymentListParams,
  RecurringPaymentOccurrences,
  UpdateRecurringPaymentRequest,
} from './types';

export const RECURRING_PAYMENTS_ENDPOINTS = {
  LIST: '/api/RecurringPayments',
  DETAIL: (id: number) => `/api/RecurringPayments/${id}`,
  OCCURRENCES: '/api/RecurringPayments/occurrences',
  PAY: (id: number) => `/api/RecurringPayments/${id}/pay`,
  /** Geri alma: vadeye bağlı kaydın silinmesi. */
  LINKED_RECORD: (record: LinkedRecord) =>
    record.type === 'donation' ? `/api/Donations/${record.id}` : `/api/Expenses/${record.id}`,
} as const;

export const recurringPaymentsApi = {
  list(page: number, params: RecurringPaymentListParams = {}): Promise<PagedResult<RecurringPaymentListItem>> {
    return apiGet<PagedResult<RecurringPaymentListItem>>(
      RECURRING_PAYMENTS_ENDPOINTS.LIST,
      buildRecurringPaymentListQuery(page, DEFAULT_PAGE_SIZE, params),
    );
  },

  get(id: number): Promise<RecurringPaymentDetail> {
    return apiGet<RecurringPaymentDetail>(RECURRING_PAYMENTS_ENDPOINTS.DETAIL(id));
  },

  /** Dönemdeki vadeler ve ödenen/bekleyen toplamlar (aralık dahil, en fazla 366 gün). */
  occurrences({ start, end }: OccurrenceRange): Promise<RecurringPaymentOccurrences> {
    return apiGet<RecurringPaymentOccurrences>(RECURRING_PAYMENTS_ENDPOINTS.OCCURRENCES, {
      startDate: start,
      endDate: end,
    });
  },

  create(request: CreateRecurringPaymentRequest): Promise<RecurringPaymentListItem> {
    return apiPost<RecurringPaymentListItem>(RECURRING_PAYMENTS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateRecurringPaymentRequest): Promise<RecurringPaymentListItem> {
    return apiPut<RecurringPaymentListItem>(RECURRING_PAYMENTS_ENDPOINTS.DETAIL(request.id), request);
  },

  /** Ödemesi olan plan silinemez (409); pasif yapılır. */
  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', RECURRING_PAYMENTS_ENDPOINTS.DETAIL(id));
  },

  /** Vadeyi öder; backend bağlı harcama ya da bağış kaydını oluşturur. */
  pay(id: number, request: PayRecurringPaymentRequest): Promise<PayRecurringPaymentResult> {
    return apiPost<PayRecurringPaymentResult>(RECURRING_PAYMENTS_ENDPOINTS.PAY(id), request);
  },

  /** Ödemeyi geri alır: bağlı harcama ya da bağış kaydını siler. */
  undo(record: LinkedRecord): Promise<string | undefined> {
    return apiSend('delete', RECURRING_PAYMENTS_ENDPOINTS.LINKED_RECORD(record));
  },
};
