// Hesap uçları (AuthController): silme önizlemesi, hesap silme, e-posta değişikliği, kişisel veri dışa aktarımı.
// Profil, oturum ve şifre uçları features/auth/api.ts'te.

import { apiGet, apiPost, apiSend } from '@/lib/api';

import type { PhotoPart } from './photo';

import type { AccountDeletionPreview, DeleteAccountRequest, RequestEmailChangeRequest } from './types';

export const ACCOUNT_ENDPOINTS = {
  DELETION_PREVIEW: '/api/Auth/account/deletion-preview',
  ACCOUNT: '/api/Auth/account',
  /** Kişisel veri dosyası (xlsx); lib/files/useFileDownload ile indirilir. */
  EXPORT: '/api/Auth/account/export',
  CHANGE_EMAIL: '/api/Auth/profile/email',
  PHOTO: '/api/Auth/profile/photo',
} as const;

export const accountApi = {
  /** Profil fotoğrafını yükler ya da değiştirir (multipart "file"). */
  uploadPhoto(part: PhotoPart): Promise<unknown> {
    const form = new FormData();
    // React Native FormData dosya parçası: { uri, name, type }
    form.append('file', part as unknown as Blob);
    // Örnek başlık application/json; FormData JSON'a çevrilmesin, sınır (boundary) ağ katmanınca eklenir
    return apiPost(ACCOUNT_ENDPOINTS.PHOTO, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
  },

  removePhoto(): Promise<string | undefined> {
    return apiSend('delete', ACCOUNT_ENDPOINTS.PHOTO);
  },

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
};
