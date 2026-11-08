// Debts uçları (DebtsController). Yetkiler: Debts.Read / Create / Update / Delete;
// ödemeler DebtPayments.Create / Update / Delete (ödeme listesi Debts.Read).

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import type {
  CreateDebtRequest,
  DebtDetail,
  DebtListItem,
  DebtListParams,
  DebtPayment,
  DebtSummary,
  SaveDebtPaymentRequest,
  UpdateDebtRequest,
} from './types';

export const DEBTS_ENDPOINTS = {
  LIST: '/api/Debts',
  SUMMARY: '/api/Debts/summary',
  DETAIL: (id: number) => `/api/Debts/${id}`,
  PAYMENTS: (debtId: number) => `/api/Debts/${debtId}/payments`,
  PAYMENT: (debtId: number, paymentId: number) => `/api/Debts/${debtId}/payments/${paymentId}`,
} as const;

export const debtsApi = {
  list(page: number, { searchTerm, isClosed, creditorPersonId, currency }: DebtListParams = {}): Promise<PagedResult<DebtListItem>> {
    return apiGet<PagedResult<DebtListItem>>(DEBTS_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
      isClosed,
      creditorPersonId,
      currency,
    });
  },

  /** Açık borç toplamları (TL ve yabancı birimler + güncel kurla TL karşılığı), kişi bazında toplamlar. */
  summary(): Promise<DebtSummary> {
    return apiGet<DebtSummary>(DEBTS_ENDPOINTS.SUMMARY);
  },

  get(id: number): Promise<DebtDetail> {
    return apiGet<DebtDetail>(DEBTS_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateDebtRequest): Promise<DebtListItem> {
    return apiPost<DebtListItem>(DEBTS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateDebtRequest): Promise<DebtListItem> {
    return apiPut<DebtListItem>(DEBTS_ENDPOINTS.DETAIL(request.id), request);
  },

  /** Ödemesi olan borç silinemez (409). */
  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', DEBTS_ENDPOINTS.DETAIL(id));
  },

  /** Borcun ödemeleri, tarihe göre (sayfasız dizi). */
  payments(debtId: number): Promise<DebtPayment[]> {
    return apiGet<DebtPayment[]>(DEBTS_ENDPOINTS.PAYMENTS(debtId));
  },

  createPayment(debtId: number, request: SaveDebtPaymentRequest): Promise<DebtPayment> {
    return apiPost<DebtPayment>(DEBTS_ENDPOINTS.PAYMENTS(debtId), request);
  },

  updatePayment(debtId: number, paymentId: number, request: SaveDebtPaymentRequest): Promise<DebtPayment> {
    return apiPut<DebtPayment>(DEBTS_ENDPOINTS.PAYMENT(debtId, paymentId), request);
  },

  removePayment(debtId: number, paymentId: number): Promise<string | undefined> {
    return apiSend('delete', DEBTS_ENDPOINTS.PAYMENT(debtId, paymentId));
  },
};
