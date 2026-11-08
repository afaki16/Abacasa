// Backend hata sözleşmesi ve uygulama içi tek hata tipi (ApiError).
//
// Abacasa hata zarfı (BaseController / ErrorResponse):
//   { success: false, error: { status: 401, code: 1012, errors: { error: ["..."] } } }
// `code` HER ZAMAN sayıdır (JsonNumberEnumConverter). Mesajlar backend'de
// Accept-Language'e göre yerelleştirilir.

import type { AxiosError } from 'axios';

/** Backend/Abacasa.Domain/Common/Enums/ErrorCode.cs aynası. Backend'e kod eklenince burayı da güncelle. */
export const ErrorCode = {
  InvalidRequest: 1000,
  ValidationFailed: 1001,
  NotFound: 1002,
  AlreadyExists: 1003,
  InternalError: 1009,
  InvalidOperation: 1010,
  Forbidden: 1011,
  Unauthorized: 1012,
  EmailNotConfirmed: 1013,
  PasswordChangeRequired: 1014,
} as const;

export interface ApiErrorPayload {
  status?: number;
  code?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Başarılı zarf: { success: true, data } veya veri dönmeyen uçlarda { success: true, message }. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiErrorPayload;
}

/**
 * Tüm API hataları buna dönüşür. status 0 → istek sunucuya hiç ulaşamadı
 * (ağ hatası / timeout); bu durumda oturum SİLİNMEZ.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: number | null = null,
    /** Alan bazlı doğrulama hataları (FluentValidation): { email: ["..."] } */
    public readonly fieldErrors: Record<string, string[]> = {},
    public readonly cause?: AxiosError,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** Tüm mesajlar düz liste halinde (form üstü hata bandı için). */
  get messages(): string[] {
    const list = Object.values(this.fieldErrors).flat().filter(Boolean);
    return list.length > 0 ? list : [this.message];
  }
}

export const NETWORK_ERROR_MESSAGE = 'Sunucuya ulaşılamadı. Bağlantını kontrol et.';
export const SESSION_EXPIRED_MESSAGE = 'Oturumun sona erdi, lütfen tekrar giriş yap.';

/**
 * Üç gövde şeklini de karşılar:
 *  1. Abacasa zarfı: { success: false, error: { code, errors } }
 *  2. ASP.NET ProblemDetails (model binding): { title, status, errors: { alan: [...] } }
 *  3. Hiçbiri (HTML hata sayfası, boş gövde) → fallback
 */
export function toApiError(body: unknown, status: number, fallback: string, cause?: AxiosError): ApiError {
  const envelope = (body ?? {}) as ApiEnvelope & { title?: string; errors?: Record<string, string[]> };
  const payload = envelope.error;
  const fieldErrors = payload?.errors ?? envelope.errors ?? {};
  const firstError = Object.values(fieldErrors).flat().find(Boolean);
  const message = payload?.message ?? firstError ?? envelope.message ?? envelope.title ?? fallback;
  const code = typeof payload?.code === 'number' ? payload.code : null;
  return new ApiError(message, payload?.status ?? status, code, fieldErrors, cause);
}

export function isApiError(error: unknown, code?: number): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}
