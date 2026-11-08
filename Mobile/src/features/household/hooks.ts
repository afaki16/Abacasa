// Hane sorguları ve mutation'ları (HouseholdController, HouseholdsController, InvitationsController).
// Yetkiler: Household.Read / Update / Delete, HouseholdMembers.Read / Create / Update / Delete.
//
// /api/Auth/me'deki hane bilgisi (activeTenant: ad, rol, modüller; memberships) değişince kullanıcı /me'den
// tazelenir. Aktif hane değişince (yeni hane, davet kabulü, ayrılma, silme) tüm sorgu önbelleği sıfırlanır.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import { useSwitchHousehold } from '@/features/auth/hooks';
import { refreshSession, type ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { householdApi } from './api';
import type {
  CreateHouseholdInvitationRequest,
  DeleteHouseholdRequest,
  HouseholdDetail,
  HouseholdInvitation,
  HouseholdInvitationSendResult,
  HouseholdMember,
  HouseholdModules,
  HouseholdRef,
  InvitationInfo,
  UpdateHouseholdMemberRequest,
  UpdateHouseholdRequest,
} from './types';

export const householdKeys = {
  all: ['household'] as const,
  detail: () => [...householdKeys.all, 'detail'] as const,
  members: () => [...householdKeys.all, 'members'] as const,
  invitations: () => [...householdKeys.all, 'invitations'] as const,
  invitationByToken: (token: string) => [...householdKeys.all, 'invitationByToken', token] as const,
};

/** Hane adı, rol ya da modüller /me yanıtında; menü ve yetkiler güncel kalsın. */
async function refreshAuthUser(): Promise<void> {
  await useAuthStore.getState().setUser(await authApi.me());
}

/**
 * Ayrılma / silme sonrası: eski hanenin token'ı artık geçersiz. Refresh ile sunucu yeni aktif haneyi seçer.
 * Interceptor'ın tek seferlik yenilemesi kullanılır (eşzamanlı 401 yenilemesiyle yarışmaz). Sunucu reddederse
 * oturum zaten geçersizdir; bir sonraki istekte interceptor oturumu kapatır.
 */
async function reselectActiveHousehold(): Promise<void> {
  try {
    await refreshSession();
  } catch {
    // Yukarıdaki nota bakın.
  }
}

// ── Sorgular ──────────────────────────────────────────────────────────────

export function useHousehold() {
  return useQuery<HouseholdDetail, ApiError>({
    queryKey: householdKeys.detail(),
    queryFn: householdApi.get,
  });
}

export function useHouseholdMembers() {
  return useQuery<HouseholdMember[], ApiError>({
    queryKey: householdKeys.members(),
    queryFn: householdApi.members,
  });
}

export function useHouseholdInvitations() {
  return useQuery<HouseholdInvitation[], ApiError>({
    queryKey: householdKeys.invitations(),
    queryFn: householdApi.invitations,
  });
}

/** Davet linkinden gelen token'ın özeti (anonim). 404: geçersiz token. */
export function useInvitationInfo(token: string | null | undefined) {
  return useQuery<InvitationInfo, ApiError>({
    queryKey: householdKeys.invitationByToken(token ?? ''),
    queryFn: () => householdApi.invitationByToken(token ?? ''),
    enabled: !!token,
    retry: false,
  });
}

// ── Aktif hane ────────────────────────────────────────────────────────────

/** Ad değişir: hane bilgisi + /me (activeTenant.name, memberships). */
export function useUpdateHousehold() {
  const queryClient = useQueryClient();
  return useMutation<HouseholdDetail, ApiError, UpdateHouseholdRequest>({
    mutationFn: householdApi.update,
    onSuccess: async (household) => {
      queryClient.setQueryData(householdKeys.detail(), household);
      await refreshAuthUser();
    },
  });
}

/** Modül aç/kapat; menü ve sayfalar /me'deki activeTenant.modules'a bakar. Veri silinmez. */
export function useUpdateHouseholdModules() {
  return useMutation<HouseholdModules, ApiError, HouseholdModules>({
    mutationFn: householdApi.updateModules,
    onSuccess: () => refreshAuthUser(),
  });
}

/** Ayrıl → sunucu yeni aktif haneyi seçer → önbellek sıfırlanır (web: /dashboard'a tam yenileme). */
export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await householdApi.leave();
      await reselectActiveHousehold();
    },
    onSuccess: () => queryClient.resetQueries(),
  });
}

/** Kalıcı silme (şifre + hane adı onayı) → yeni aktif hane → önbellek sıfırlanır. */
export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, DeleteHouseholdRequest>({
    mutationFn: async (request) => {
      await householdApi.remove(request);
      await reselectActiveHousehold();
    },
    onSuccess: () => queryClient.resetQueries(),
  });
}

/** Yeni hane: oluştur ve ona geç (web ile aynı). Geçiş önbelleği sıfırlar. */
export function useCreateHousehold() {
  const switchHousehold = useSwitchHousehold();
  return useMutation<HouseholdRef, ApiError, string>({
    mutationFn: async (name) => {
      const household = await householdApi.create({ name });
      await switchHousehold.mutateAsync(household.id);
      return household;
    },
  });
}

// ── Üyeler ────────────────────────────────────────────────────────────────

/**
 * Rol / kişi bağı değişir. Kendi rolü değiştiyse izinler de değişir → /me tazelenir.
 * Davet listesindeki kişi adları etkilenmez.
 */
export function useUpdateHouseholdMember() {
  const queryClient = useQueryClient();
  return useMutation<HouseholdMember, ApiError, UpdateHouseholdMemberRequest>({
    mutationFn: householdApi.updateMember,
    onSuccess: async (member) => {
      await queryClient.invalidateQueries({ queryKey: householdKeys.members() });
      if (member.isCurrentUser) await refreshAuthUser();
    },
  });
}

/** Üye sayısı da değişir (detail.memberCount). */
export function useRemoveHouseholdMember() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (membershipId) => {
      await householdApi.removeMember(membershipId);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: householdKeys.members() }),
        queryClient.invalidateQueries({ queryKey: householdKeys.detail() }),
      ]),
  });
}

// ── Davetler ──────────────────────────────────────────────────────────────

/** Sonuçtaki emailSent false ise davet yine geçerlidir (e-posta gönderilemedi). */
export function useCreateHouseholdInvitation() {
  const queryClient = useQueryClient();
  return useMutation<HouseholdInvitationSendResult, ApiError, CreateHouseholdInvitationRequest>({
    mutationFn: householdApi.createInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.invitations() }),
  });
}

export function useResendHouseholdInvitation() {
  const queryClient = useQueryClient();
  return useMutation<HouseholdInvitationSendResult, ApiError, number>({
    mutationFn: householdApi.resendInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.invitations() }),
  });
}

export function useRevokeHouseholdInvitation() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await householdApi.revokeInvitation(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.invitations() }),
  });
}

/** Daveti kabul et ve davetin hanesine geç (web ile aynı). Geçiş önbelleği sıfırlar. */
export function useAcceptInvitation() {
  const switchHousehold = useSwitchHousehold();
  return useMutation<number, ApiError, string>({
    mutationFn: async (token) => {
      const tenantId = await householdApi.acceptInvitation(token);
      await switchHousehold.mutateAsync(tenantId);
      return tenantId;
    },
  });
}
