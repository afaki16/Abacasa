// Ana axios instance + request interceptor (Bearer token).
// Response interceptor (401 → refresh) ayrı dosyada: ./refreshInterceptor.
// Tüketim için barrel kullan: import { apiGet } from '@/lib/api'.

import { create, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/lib/config/env';
import { useAuthStore } from '@/stores/authStore';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * Anonim uçlar (login, discover, refresh, şifremi unuttum…): Authorization eklenmez
     * ve 401 refresh akışını tetiklemez — orada 401 "bilgiler hatalı" demektir.
     */
    _skipAuth?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    /** Refresh sonrası tekrar denendi mi — sonsuz döngü koruması. */
    _retry?: boolean;
  }
}

export const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Backend bu başlığı görünce refresh token'ı cookie olarak YAZMAZ ve cookie'den OKUMAZ.
 * RN'nin ağ katmanı cookie'leri düz metin bir veritabanında saklar; token yalnızca SecureStore'da kalmalı.
 */
export const CLIENT_HEADERS = { 'X-Client': 'mobile' } as const;

export const apiClient: AxiosInstance = create({
  baseURL: env.apiBaseUrl,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Backend hata mesajlarını bu dile göre yerelleştirir (tr | en).
    'Accept-Language': 'tr',
    ...CLIENT_HEADERS,
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config._skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  if (__DEV__) {
    console.log(`[API →] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});
