// Ledger uçları (LedgerController, yıllık tablo). Yetkiler: Ledger.Read / Create / Update / Delete.

import { apiGet, apiPost, apiPut, apiSend } from '@/lib/api';

import type {
  CreateLedgerItemRequest,
  LedgerItem,
  LedgerMonthlyAmount,
  LedgerYear,
  SetMonthlyAmountVariables,
  UpdateLedgerItemRequest,
} from './types';

export const LEDGER_ENDPOINTS = {
  YEAR: (year: number) => `/api/Ledger/year/${year}`,
  ITEMS: '/api/Ledger/items',
  ITEM: (id: number) => `/api/Ledger/items/${id}`,
  AMOUNT: (id: number, year: number, month: number) => `/api/Ledger/items/${id}/amounts/${year}/${month}`,
} as const;

export const ledgerApi = {
  year(year: number): Promise<LedgerYear> {
    return apiGet<LedgerYear>(LEDGER_ENDPOINTS.YEAR(year));
  },

  getItem(id: number): Promise<LedgerItem> {
    return apiGet<LedgerItem>(LEDGER_ENDPOINTS.ITEM(id));
  },

  createItem(request: CreateLedgerItemRequest): Promise<LedgerItem> {
    return apiPost<LedgerItem>(LEDGER_ENDPOINTS.ITEMS, request);
  },

  updateItem(request: UpdateLedgerItemRequest): Promise<LedgerItem> {
    return apiPut<LedgerItem>(LEDGER_ENDPOINTS.ITEM(request.id), request);
  },

  /** Tutarı olan kalem silinemez (409); pasif yapılır. */
  removeItem(id: number): Promise<string | undefined> {
    return apiSend('delete', LEDGER_ENDPOINTS.ITEM(id));
  },

  /** Hücreyi yazar (yeni kayıtta 201, güncelleme/temizlemede 200; ikisi de hücreyi döner). */
  setMonthlyAmount({ itemId, year, month, amount }: SetMonthlyAmountVariables): Promise<LedgerMonthlyAmount> {
    return apiPut<LedgerMonthlyAmount>(LEDGER_ENDPOINTS.AMOUNT(itemId, year, month), { amount });
  },
};
