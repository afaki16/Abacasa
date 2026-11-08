// Response interceptor:
//  - 401 → refresh token rotation → orijinal isteği bir kez tekrarla.
//    Eşzamanlı 401'ler TEK refresh isteğini paylaşır (single-flight promise).
//  - 403 + PasswordChangeRequired → bayrağı store'a yaz; route guard zorunlu şifre
//    ekranına yönlendirir (admin bayrağı oturum sırasında açtıysa).
//  - Diğer tüm hatalar → ApiError.
//
// Yan etkiyle kayıt olur; ./index (barrel) import eder.

import axios, { isAxiosError, type AxiosError } from 'axios';

import type { LoginResponse } from '@/features/auth/types';
import { env } from '@/lib/config/env';
import { useAuthStore } from '@/stores/authStore';

import { apiClient, CLIENT_HEADERS } from './client';
import { AUTH_ENDPOINTS } from './endpoints';
import {
  ApiError,
  ErrorCode,
  NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  toApiError,
  type ApiEnvelope,
} from './errors';

let refreshPromise: Promise<string> | null = null;

/** Sunucunun refresh'i reddettiğini (ağ hatası değil) belirtir. */
class RefreshRejectedError extends Error {}

async function performRefresh(): Promise<string> {
  const { accessToken, refreshToken } = useAuthStore.getState();
  if (!accessToken || !refreshToken) throw new RefreshRejectedError('No tokens');

  try {
    // Ham axios: apiClient kullanılırsa interceptor kendini tetikler.
    // Backend iki token'ı da ister (süresi dolmuş access + refresh).
    const { data } = await axios.post<ApiEnvelope<LoginResponse>>(
      `${env.apiBaseUrl}${AUTH_ENDPOINTS.REFRESH_TOKEN}`,
      { accessToken, refreshToken },
      { timeout: 10_000, headers: { 'Content-Type': 'application/json', ...CLIENT_HEADERS } },
    );
    if (!data.success || !data.data?.accessToken) throw new RefreshRejectedError('Bad response');

    // Rotation: backend her refresh'te eski refresh token'ı iptal eder — ikisi de kaydedilmeli.
    await useAuthStore.getState().updateSession(data.data);
    return data.data.accessToken;
  } catch (error) {
    // Sunucu cevap verdiyse (400/401…) refresh token geçersiz. Cevap yoksa ağ sorunu.
    if (isAxiosError(error) && error.response) throw new RefreshRejectedError('Rejected');
    throw error;
  }
}

function refreshOnce(): Promise<string> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

apiClient.interceptors.response.use(
  // Result pattern'de success=false 2xx ile de gelebilir; bunu ./http yardımcıları denetler.
  (response) => response,
  async (error: AxiosError<ApiEnvelope>) => {
    const original = error.config;
    const status = error.response?.status ?? 0;

    if (status === 401 && original && !original._retry && !original._skipAuth) {
      original._retry = true;
      try {
        const token = await refreshOnce();
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        if (refreshError instanceof RefreshRejectedError) {
          await useAuthStore.getState().clearAuth();
          return Promise.reject(new ApiError(SESSION_EXPIRED_MESSAGE, 401, ErrorCode.Unauthorized));
        }
        // Çevrimdışı açılış / timeout: oturum korunur, bağlantı gelince yeniden denenir.
        return Promise.reject(new ApiError(NETWORK_ERROR_MESSAGE, 0));
      }
    }

    const apiError = status === 0
      ? new ApiError(NETWORK_ERROR_MESSAGE, 0, null, {}, error)
      : toApiError(error.response?.data, status, error.message || 'İstek başarısız oldu', error);

    if (apiError.status === 403 && apiError.code === ErrorCode.PasswordChangeRequired) {
      useAuthStore.getState().markPasswordChangeRequired();
    }

    return Promise.reject(apiError);
  },
);
