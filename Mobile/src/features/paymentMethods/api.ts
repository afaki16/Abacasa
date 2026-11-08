// PaymentMethods uçları (PaymentMethodsController). Yetkiler: PaymentMethods.Read / Create / Update / Delete.
// Kullanımdaki ödeme aracı silinemez (409, "kullanımda"); bunun yerine pasif yapılır.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import { PAYMENT_METHOD_OPTIONS_PAGE_SIZE } from './constants';
import type {
  CreatePaymentMethodRequest,
  PaymentMethod,
  PaymentMethodDetail,
  PaymentMethodListParams,
  UpdatePaymentMethodRequest,
} from './types';

export const PAYMENT_METHODS_ENDPOINTS = {
  LIST: '/api/PaymentMethods',
  DETAIL: (id: number) => `/api/PaymentMethods/${id}`,
} as const;

export const paymentMethodsApi = {
  list(page: number, { searchTerm, isActive }: PaymentMethodListParams = {}): Promise<PagedResult<PaymentMethod>> {
    return apiGet<PagedResult<PaymentMethod>>(PAYMENT_METHODS_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
      isActive,
    });
  },

  /**
   * Seçiciler için tüm ödeme araçları (pasifler dahil, tek sayfa). Pasif araç yeni kayıtta gizlenir ama
   * düzenlenen eski kayıtta görünmelidir; süzme çağıranda yapılır.
   */
  async options(): Promise<PaymentMethod[]> {
    const result = await apiGet<PagedResult<PaymentMethod>>(PAYMENT_METHODS_ENDPOINTS.LIST, {
      page: 1,
      pageSize: PAYMENT_METHOD_OPTIONS_PAGE_SIZE,
    });
    return result.items;
  },

  get(id: number): Promise<PaymentMethodDetail> {
    return apiGet<PaymentMethodDetail>(PAYMENT_METHODS_ENDPOINTS.DETAIL(id));
  },

  create(request: CreatePaymentMethodRequest): Promise<PaymentMethod> {
    return apiPost<PaymentMethod>(PAYMENT_METHODS_ENDPOINTS.LIST, request);
  },

  update(request: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
    return apiPut<PaymentMethod>(PAYMENT_METHODS_ENDPOINTS.DETAIL(request.id), request);
  },

  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', PAYMENT_METHODS_ENDPOINTS.DETAIL(id));
  },
};
