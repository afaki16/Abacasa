// TanStack Query ile kullanılan ince yardımcılar. Result zarfını açar; success=false
// gelirse (2xx olsa bile) ApiError fırlatır — sorgu/mutation hataları hep ApiError'dır.

import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { apiClient } from './client';
import { ApiError, toApiError, type ApiEnvelope } from './errors';

type RequestOptions = Pick<AxiosRequestConfig, 'timeout' | 'signal' | '_skipAuth' | 'headers'>;
type Params = Record<string, string | number | boolean | undefined | null>;

function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): ApiEnvelope<T> {
  if (!response.data?.success) {
    throw toApiError(response.data, response.status, 'İstek başarısız oldu');
  }
  return response.data;
}

function requireData<T>(envelope: ApiEnvelope<T>, status: number): T {
  if (envelope.data === undefined || envelope.data === null) {
    throw new ApiError('Sunucu beklenen veriyi döndürmedi', status);
  }
  return envelope.data;
}

export async function apiGet<T>(url: string, params?: Params, options?: RequestOptions): Promise<T> {
  const response = await apiClient.get<ApiEnvelope<T>>(url, { params, ...options });
  return requireData(unwrap(response), response.status);
}

export async function apiPost<T, B = unknown>(url: string, body?: B, options?: RequestOptions): Promise<T> {
  const response = await apiClient.post<ApiEnvelope<T>>(url, body, options);
  return requireData(unwrap(response), response.status);
}

export async function apiPut<T, B = unknown>(url: string, body?: B, options?: RequestOptions): Promise<T> {
  const response = await apiClient.put<ApiEnvelope<T>>(url, body, options);
  return requireData(unwrap(response), response.status);
}

/** Veri dönmeyen uçlar ({ success, message }): yalnızca başarıyı doğrular, mesajı döner. */
export async function apiSend<B = unknown>(
  method: 'post' | 'put' | 'delete',
  url: string,
  body?: B,
  options?: RequestOptions,
): Promise<string | undefined> {
  const response = await apiClient.request<ApiEnvelope<never>>({ method, url, data: body, ...options });
  return unwrap(response).message;
}
