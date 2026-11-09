// Hesap uçları (AuthController): silme önizlemesi, hesap silme, e-posta değişikliği, kişisel veri dışa aktarımı.
// Profil, oturum ve şifre uçları features/auth/api.ts'te.

import { apiGet, apiSend } from '@/lib/api';
import { env } from '@/lib/config/env';

import type { AccountDeletionPreview, DeleteAccountRequest, RequestEmailChangeRequest } from './types';

export const ACCOUNT_ENDPOINTS = {
  DELETION_PREVIEW: '/api/Auth/account/deletion-preview',
  ACCOUNT: '/api/Auth/account',
  EXPORT: '/api/Auth/account/export',
  CHANGE_EMAIL: '/api/Auth/profile/email',
} as const;

export const accountApi = {
  deletionPreview(): Promise<AccountDeletionPreview> {
    return apiGet<AccountDeletionPreview>(ACCOUNT_ENDPOINTS.DELETION_PREVIEW);
  },

  /** Hesabı anonimleştirir; son yönetici olunan hane varsa 400. */
  deleteAccount(request: DeleteAccountRequest): Promise<string | undefined> {
    return apiSend('delete', ACCOUNT_ENDPOINTS.ACCOUNT, request);
  },

  /** Mevcut şifre doğrulanır, yeni adrese bağlantı gider (bağlantı web'de açılır). */
  requestEmailChange(request: RequestEmailChangeRequest): Promise<string | undefined> {
    return apiSend('put', ACCOUNT_ENDPOINTS.CHANGE_EMAIL, {
      ...request,
      newEmail: request.newEmail.trim().toLowerCase(),
    });
  },

  /**
   * Kişisel veri dosyasının (xlsx) tam adresi. Bearer token gerektirir; dosyayı kaydetmek için native dosya
   * modülü (expo-file-system / expo-sharing) gerekir — şimdilik mobilde kullanılmıyor (web'den indirilir).
   */
  exportUrl(): string {
    return `${env.apiBaseUrl}${ACCOUNT_ENDPOINTS.EXPORT}`;
  },
};
