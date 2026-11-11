// Hane uçları: HouseholdController (aktif hane; token'daki hane), HouseholdsController (yeni hane),
// InvitationsController (token sahibi). Yetkiler: Household.Read / Update / Delete,
// HouseholdMembers.Read / Create / Update / Delete. Hane oluşturma, ayrılma ve davet kabulü yetki istemez.
// Hiçbir istekte tenantId gönderilmez; aktif hane access token'dan gelir.

import { apiGet, apiPost, apiPut, apiSend } from '@/lib/api';

import type {
  CreateHouseholdInvitationRequest,
  CreateHouseholdRequest,
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

export const HOUSEHOLD_ENDPOINTS = {
  CURRENT: '/api/Household',
  /** Excel dışa aktarımı (Household.Update); ikili yanıt, lib/files/useFileDownload ile indirilir. */
  EXPORT: '/api/Household/export',
  MODULES: '/api/Household/modules',
  MEMBERS: '/api/Household/members',
  MEMBER: (membershipId: number) => `/api/Household/members/${membershipId}`,
  LEAVE: '/api/Household/leave',
  INVITATIONS: '/api/Household/invitations',
  INVITATION: (id: number) => `/api/Household/invitations/${id}`,
  RESEND_INVITATION: (id: number) => `/api/Household/invitations/${id}/resend`,
  CREATE: '/api/Households',
  INVITATION_BY_TOKEN: (token: string) => `/api/Invitations/${encodeURIComponent(token)}`,
  ACCEPT_INVITATION: '/api/Invitations/accept',
} as const;

export const householdApi = {
  // ── Aktif hane ──────────────────────────────────────────────────────────
  get(): Promise<HouseholdDetail> {
    return apiGet<HouseholdDetail>(HOUSEHOLD_ENDPOINTS.CURRENT);
  },

  update(request: UpdateHouseholdRequest): Promise<HouseholdDetail> {
    return apiPut<HouseholdDetail>(HOUSEHOLD_ENDPOINTS.CURRENT, request);
  },

  /** Kalıcı silme (tüm kayıtlar, üyelikler, davetler). Örnek haneler silinemez (400). */
  remove(request: DeleteHouseholdRequest): Promise<string | undefined> {
    return apiSend('delete', HOUSEHOLD_ENDPOINTS.CURRENT, request);
  },

  updateModules(modules: HouseholdModules): Promise<HouseholdModules> {
    return apiPut<HouseholdModules>(HOUSEHOLD_ENDPOINTS.MODULES, modules);
  },

  /** Ayrılma; son üye ya da son yönetici ayrılamaz (400). */
  leave(): Promise<string | undefined> {
    return apiSend('post', HOUSEHOLD_ENDPOINTS.LEAVE);
  },

  // ── Üyeler ──────────────────────────────────────────────────────────────
  members(): Promise<HouseholdMember[]> {
    return apiGet<HouseholdMember[]>(HOUSEHOLD_ENDPOINTS.MEMBERS);
  },

  /** Son yönetici düşürülemez (400). */
  updateMember({ membershipId, role, personId }: UpdateHouseholdMemberRequest): Promise<HouseholdMember> {
    return apiPut<HouseholdMember>(HOUSEHOLD_ENDPOINTS.MEMBER(membershipId), { role, personId });
  },

  /** Kendini çıkarmak yasak (400); bunun için leave. */
  removeMember(membershipId: number): Promise<string | undefined> {
    return apiSend('delete', HOUSEHOLD_ENDPOINTS.MEMBER(membershipId));
  },

  // ── Davetler ────────────────────────────────────────────────────────────
  /** Bekleyenler önce, sonra yeniden eskiye. */
  invitations(): Promise<HouseholdInvitation[]> {
    return apiGet<HouseholdInvitation[]>(HOUSEHOLD_ENDPOINTS.INVITATIONS);
  },

  /** Zaten üye ya da bekleyen davet varsa 409. */
  createInvitation(request: CreateHouseholdInvitationRequest): Promise<HouseholdInvitationSendResult> {
    return apiPost<HouseholdInvitationSendResult>(HOUSEHOLD_ENDPOINTS.INVITATIONS, request);
  },

  /** Bekleyen ya da süresi dolmuş davete yeni token ve süre; eski token geçersiz olur. */
  resendInvitation(id: number): Promise<HouseholdInvitationSendResult> {
    return apiPost<HouseholdInvitationSendResult>(HOUSEHOLD_ENDPOINTS.RESEND_INVITATION(id));
  },

  revokeInvitation(id: number): Promise<string | undefined> {
    return apiSend('delete', HOUSEHOLD_ENDPOINTS.INVITATION(id));
  },

  // ── Yeni hane ve davet kabulü ───────────────────────────────────────────
  /** Çağıran yönetici olur; aktif hane DEĞİŞMEZ (geçiş ayrıca yapılır). En fazla 10 yöneticilik (400). */
  create(request: CreateHouseholdRequest): Promise<HouseholdRef> {
    return apiPost<HouseholdRef>(HOUSEHOLD_ENDPOINTS.CREATE, request);
  },

  /** Anonim davet özeti. */
  invitationByToken(token: string): Promise<InvitationInfo> {
    return apiGet<InvitationInfo>(HOUSEHOLD_ENDPOINTS.INVITATION_BY_TOKEN(token), undefined, { _skipAuth: true });
  },

  /** Girişli kullanıcının e-postasına gelen daveti kabul eder; hanenin id'sini döner (ardından geçiş yapılır). */
  async acceptInvitation(token: string): Promise<number> {
    const result = await apiPost<{ tenantId: number }>(HOUSEHOLD_ENDPOINTS.ACCEPT_INVITATION, { token });
    return result.tenantId;
  },

};
