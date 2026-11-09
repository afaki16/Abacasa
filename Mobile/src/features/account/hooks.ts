// Hesap sorguları ve mutation'ları: silme önizlemesi, hesap silme, e-posta değişikliği, oturum özeti.
// Oturum özeti auth anahtarının altında durur: useRevokeSession'ın geçersiz kılması bunu da tazeler.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import { getOrCreateDeviceId } from '@/features/auth/deviceId';
import { authKeys } from '@/features/auth/hooks';
import type { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { accountApi } from './api';
import { buildSessionOverview, type SessionOverview } from './sessionsView';
import type { AccountDeletionPreview, DeleteAccountRequest, RequestEmailChangeRequest } from './types';

export const accountKeys = {
  all: ['account'] as const,
  deletionPreview: () => [...accountKeys.all, 'deletionPreview'] as const,
  sessionOverview: () => [...authKeys.sessions(), 'overview'] as const,
};

export function useAccountDeletionPreview() {
  return useQuery<AccountDeletionPreview, ApiError>({
    queryKey: accountKeys.deletionPreview(),
    queryFn: accountApi.deletionPreview,
    staleTime: 0,
  });
}

/** Başarıda yerel oturum silinir; guard giriş ekranına geçer (yönlendirme yapılmaz). */
export function useDeleteAccount() {
  return useMutation<void, ApiError, DeleteAccountRequest>({
    mutationFn: async (request) => {
      await accountApi.deleteAccount(request);
      await useAuthStore.getState().clearAuth();
    },
  });
}

export function useRequestEmailChange() {
  return useMutation<void, ApiError, RequestEmailChangeRequest>({
    mutationFn: async (request) => {
      await accountApi.requestEmailChange(request);
    },
  });
}

/** Aktif oturumlar (bu cihaz üstte) ve kapanmış / süresi dolmuş oturum geçmişi. */
export function useSessionOverview() {
  return useQuery<SessionOverview, ApiError>({
    queryKey: accountKeys.sessionOverview(),
    queryFn: async () => {
      const [sessions, deviceId] = await Promise.all([authApi.sessions(), getOrCreateDeviceId()]);
      return buildSessionOverview(sessions, deviceId, Date.now());
    },
    staleTime: 0,
  });
}

/** "Diğer tüm oturumları kapat": bu cihaz açık kalır (logout-all bunu da kapatırdı); diğerleri tek tek. */
export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number[]>({
    mutationFn: async (sessionIds) => {
      for (const id of sessionIds) await authApi.revokeSession(id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions() }),
  });
}
