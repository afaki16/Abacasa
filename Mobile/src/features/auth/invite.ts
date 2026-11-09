// Davet ekranının durum kararı (web: Frontend/pages/auth/accept-invite.vue ile aynı mantık).

import type { InvitationInfo } from '@/features/household/types';
import { ApiError, ErrorCode } from '@/lib/api/errors';

export type InviteView =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'unavailable'; reason: 'notFound' | 'Accepted' | 'Revoked' | 'Expired' }
  | { kind: 'pending'; info: InvitationInfo };

/** Token yoksa ya da 404 ise "bulunamadı"; ağ/sunucu hatası tekrar denenebilir hata. */
export function resolveInviteView(
  token: string | null | undefined,
  query: { data?: InvitationInfo; error?: unknown; isPending: boolean },
): InviteView {
  if (!token) return { kind: 'unavailable', reason: 'notFound' };
  if (query.data) {
    const { status } = query.data;
    return status === 'Pending' ? { kind: 'pending', info: query.data } : { kind: 'unavailable', reason: status };
  }
  if (query.error) {
    const error = query.error;
    const notFound =
      error instanceof ApiError && (error.status === 404 || error.code === ErrorCode.NotFound || error.status === 400);
    return notFound ? { kind: 'unavailable', reason: 'notFound' } : { kind: 'error' };
  }
  return { kind: 'loading' };
}

export type InviteAction =
  /** Girişli ve e-posta eşleşiyor: doğrudan katıl. */
  | 'accept'
  /** Girişli ama başka hesap: çıkış yapıp doğru hesapla girmeli. */
  | 'otherAccount'
  /** Girişsiz, bu e-postayla hesap var: giriş yap ve katıl. */
  | 'login'
  /** Girişsiz, hesap yok: kayıt ol ve katıl (ya da yine de giriş). */
  | 'register';

export function resolveInviteAction(info: InvitationInfo, userEmail: string | null | undefined): InviteAction {
  if (userEmail) {
    return userEmail.trim().toLowerCase() === info.email.trim().toLowerCase() ? 'accept' : 'otherAccount';
  }
  return info.userExists ? 'login' : 'register';
}

/** Davetin bitmesine kalan gün (yukarı yuvarlanır: 3 saat kaldıysa 1). Geçmişse 0; tarih yoksa null. */
export function inviteDaysLeft(expiresAt: string | null | undefined, now: Date = new Date()): number | null {
  if (!expiresAt) return null;
  const ms = Date.parse(expiresAt) - now.getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
