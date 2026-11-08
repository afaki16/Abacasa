// Auth akışları (ekranlardan bağımsız). Oturum değişikliklerinde yönlendirme YAPILMAZ:
// kök layout'taki Stack.Protected guard'ları doğru ekrana kendisi geçer.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { authApi, type LoginInput } from './api';
import { getOrCreateDeviceId } from './deviceId';
import type { ConsentDocument, RegisterRequest, Session, UpdateProfileRequest } from './types';

export const authKeys = {
  all: ['auth'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
};

// ── Giriş / çıkış ─────────────────────────────────────────────────────────

/** E-posta + şifre ile giriş. Abacasa'da e-posta tekildir; hane girişte seçilmez (son aktif hane açılır). */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation<void, ApiError, LoginInput>({
    mutationFn: async (input) => {
      await setSession(await authApi.login(input));
    },
  });
}

/** Çıkış: sunucuda refresh token iptal edilir; sonuç ne olursa olsun yerel oturum silinir. */
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      try {
        if (refreshToken) await authApi.logout(refreshToken);
      } catch {
        // Çevrimdışı / token zaten geçersiz: yerel çıkış yine yapılır.
      } finally {
        await clearAuth();
      }
    },
  });
}

/** Bu cihaz dahil tüm cihazlardan çıkış. Sunucu reddetse de yerel oturum silinir. */
export function useLogoutAll() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      try {
        await authApi.logoutAll();
      } finally {
        await clearAuth();
      }
    },
  });
}

// ── Kayıt ve e-posta doğrulama ────────────────────────────────────────────

/** Kayıt sonrası hesap "doğrulama bekliyor" durumundadır; giriş için e-postadaki link açılmalı. */
export function useRegister() {
  return useMutation<void, ApiError, RegisterRequest>({
    mutationFn: async (request) => {
      await authApi.register(request);
    },
  });
}

export function useResendVerification() {
  return useMutation<void, ApiError, string>({
    mutationFn: async (email) => {
      await authApi.resendVerification(email);
    },
  });
}

// ── Şifre ─────────────────────────────────────────────────────────────────

/** Girişsiz "şifremi unuttum": e-postaya 6 haneli kod. */
export function useSendPasswordResetCode() {
  return useMutation<void, ApiError, string>({
    mutationFn: async (email) => {
      await authApi.sendPasswordResetCode(email);
    },
  });
}

/** Kodla yeni şifre. Başarıdan sonra kullanıcı yeni şifreyle giriş yapar (oturum açılmaz). */
export function useResetPasswordWithCode() {
  return useMutation<void, ApiError, { email: string; code: string; newPassword: string }>({
    mutationFn: async ({ email, code, newPassword }) => {
      await authApi.resetPasswordWithCode(email, code, newPassword);
    },
  });
}

/** Girişli kullanıcı mevcut şifresini hatırlamıyorsa: e-postaya 6 haneli kod. */
export function useSendPasswordChangeCode() {
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await authApi.sendPasswordChangeCode();
    },
  });
}

export type PasswordChangeInput =
  | { mode: 'current'; currentPassword: string; newPassword: string }
  | { mode: 'code'; code: string; newPassword: string };

/**
 * Şifre değişimi (mevcut şifreyle ya da kodla). Backend TÜM oturumları kapatır ve
 * MustChangePassword bayrağını indirir; kullanıcı düşmesin diye yeni şifreyle bu cihaz
 * için yeniden giriş yapılır. Zorunlu şifre ekranı ve profildeki ekran bunu kullanır.
 *
 * 1,1 sn bekleme şart: oturum iptali ms, JWT `iat` saniye hassasiyetinde — aynı saniyede
 * alınan token iptal edilmiş sayılır (bkz. TEMPLATE_UPGRADES.md madde 2).
 */
export function useChangePassword() {
  return useMutation<{ reloggedIn: boolean }, ApiError, PasswordChangeInput>({
    mutationFn: async (input) => {
      const { user, setSession, clearAuth } = useAuthStore.getState();
      if (!user) throw new ApiError('Oturum bulunamadı', 401);

      if (input.mode === 'current') {
        await authApi.changePassword(input.currentPassword, input.newPassword);
      } else {
        await authApi.changePasswordWithCode(input.code, input.newPassword);
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));

      try {
        await setSession(
          await authApi.login({ email: user.email, password: input.newPassword }),
        );
        return { reloggedIn: true };
      } catch {
        // Şifre değişti ama yeniden giriş olmadı: kullanıcı yeni şifreyle girer.
        await clearAuth();
        return { reloggedIn: false };
      }
    },
  });
}

// ── Hane ve yasal onaylar ─────────────────────────────────────────────────

/**
 * Aktif haneyi değiştirir. Backend eski refresh token'ı iptal edip yeni çift verir; hane verisi
 * değiştiği için sorgu önbelleği sıfırlanır.
 */
export function useSwitchHousehold() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: async (tenantId) => {
      const { refreshToken, setSession } = useAuthStore.getState();
      if (!refreshToken) throw new ApiError('Oturum bulunamadı', 401);
      await setSession(await authApi.switchHousehold(tenantId, refreshToken));
    },
    onSuccess: () => queryClient.resetQueries(),
  });
}

/** Bekleyen yasal metinleri onaylar; kalan yoksa guard uygulamaya geçer. */
export function useAcceptConsents() {
  return useMutation<void, ApiError, ConsentDocument[]>({
    mutationFn: async (documents) => {
      const pending = await authApi.acceptConsents(documents);
      const { user, setUser } = useAuthStore.getState();
      if (user) await setUser({ ...user, pendingConsents: pending });
    },
  });
}

// ── Profil ve oturumlar ───────────────────────────────────────────────────

/** Profil güncellenince güncel kullanıcı /me'den alınır (sunucu normalize ettiği değerleri döner). */
export function useUpdateProfile() {
  return useMutation<void, ApiError, UpdateProfileRequest>({
    mutationFn: async (request) => {
      await authApi.updateProfile(request);
      await useAuthStore.getState().setUser(await authApi.me());
    },
  });
}

export interface SessionItem extends Session {
  /** Bu cihazın oturumu mu (deviceId eşleşmesi; backend henüz işaretlemiyor). */
  isThisDevice: boolean;
}

/** Aktif oturumlar; bu cihazınki en üstte. */
export function useSessions() {
  return useQuery<SessionItem[], ApiError>({
    queryKey: authKeys.sessions(),
    queryFn: async () => {
      const [sessions, deviceId] = await Promise.all([authApi.sessions(), getOrCreateDeviceId()]);
      return sessions
        .filter((s) => s.isActive)
        .map((s) => ({ ...s, isThisDevice: !!s.deviceId && s.deviceId === deviceId }))
        .sort((a, b) =>
          a.isThisDevice !== b.isThisDevice
            ? Number(b.isThisDevice) - Number(a.isThisDevice)
            : b.createdDate.localeCompare(a.createdDate),
        );
    },
    staleTime: 0,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (sessionId) => {
      await authApi.revokeSession(sessionId);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions() }),
  });
}

/**
 * Açılışta saklı oturumu sunucuya doğrulatır (GET /me). Açılışı BLOKLAMAZ.
 *  - Access token süresi dolmuşsa interceptor yeniler.
 *  - Refresh de reddedilirse interceptor oturumu kapatır → guard login'e götürür.
 *  - Ağ hatasında hiçbir şey olmaz (çevrimdışı açılış oturumu düşürmez).
 */
export function useSessionValidation(): void {
  const isRehydrating = useAuthStore((s) => s.isRehydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isUserVerified = useAuthStore((s) => s.isUserVerified);
  const inFlight = useRef(false);

  useEffect(() => {
    if (isRehydrating || !isAuthenticated || isUserVerified || inFlight.current) return;
    inFlight.current = true;
    authApi
      .me()
      .then((user) => useAuthStore.getState().setUser(user))
      .catch(() => {
        // Oturum hataları interceptor'da ele alınır.
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [isRehydrating, isAuthenticated, isUserVerified]);
}
