import type {
  HouseholdDetail,
  HouseholdInvitation,
  HouseholdInvitationSendResult,
  HouseholdMember,
  HouseholdRole,
  HouseholdRoleValue,
  InvitationInfo,
  InvitationStatus,
  LoginResponse
} from '~/types'
import { API_ENDPOINTS } from '~/utils/apiEndpoints'
import { useAuthStore } from '~/stores/auth'
import { useApi } from './useApi'

// Hane değişince sayfalarda eski haneden veri kalmasın diye tam sayfa yenilemesiyle özete gidilir
export const reloadToDashboard = () => {
  if (import.meta.client) window.location.assign('/dashboard')
}

// Davet token'ı URL'de kalmasın diye sekme oturumunda tutulur (kabul ya da davetli kayıt bitince silinir)
const INVITE_TOKEN_KEY = 'abacasa.inviteToken'

export const getStoredInviteToken = (): string | null => {
  try {
    return sessionStorage.getItem(INVITE_TOKEN_KEY)
  } catch {
    return null
  }
}

export const storeInviteToken = (token: string) => {
  try {
    sessionStorage.setItem(INVITE_TOKEN_KEY, token)
  } catch {
    // sessionStorage yoksa token yalnızca bu sayfada kullanılır
  }
}

export const clearInviteToken = () => {
  try {
    sessionStorage.removeItem(INVITE_TOKEN_KEY)
  } catch {
    // yok sayılır
  }
}

export const useHousehold = () => {
  const api = useApi()
  const authStore = useAuthStore()

  const activeTenant = computed(() => authStore.user?.activeTenant ?? null)
  const memberships = computed(() => authStore.user?.memberships ?? [])

  const getRoleLabel = (role?: HouseholdRole | null) => (role === 'Admin' ? 'Yönetici' : role === 'Member' ? 'Üye' : '')

  // Refresh token HttpOnly cookie'de; backend yeni hane ile döndürür ve cookie'yi günceller
  const switchHousehold = async (tenantId: number) => {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.SWITCH_HOUSEHOLD, { tenantId }, { silent: true })
    if (response.data?.accessToken) await authStore.setAuth(response.data)
    reloadToDashboard()
  }

  // Yeni hane: oluştur, ona geç, tam yenile. Hatalar çağırana (pencereye) bırakılır
  const createHousehold = async (name: string) => {
    const response = await api.post<{ id: number; name: string }>(API_ENDPOINTS.HOUSEHOLDS.CREATE, { name }, { silent: true })
    await switchHousehold(response.data.id)
  }

  // Token sahibine davet özeti (anonim). Toast gösterilmez; 404 vb. hatalar sayfada mesajla karşılanır
  const getInvitation = async (token: string): Promise<InvitationInfo> => {
    const { $api } = useNuxtApp()
    const response = await $api.get(API_ENDPOINTS.INVITATIONS.GET_BY_TOKEN(token))
    return response.data.data
  }

  // Kabul → davetin hanesine geç → tam yenileme
  const acceptInvitation = async (token: string) => {
    const response = await api.post<{ tenantId: number }>(API_ENDPOINTS.INVITATIONS.ACCEPT, { token }, { silent: true })
    clearInviteToken()
    await switchHousehold(response.data.tenantId)
  }

  //#region Aktif hane: bilgi, üyeler, davetler (hata toast'ları useApi'de)
  const getHousehold = async () => (await api.get<HouseholdDetail>(API_ENDPOINTS.HOUSEHOLD.GET)).data
  const updateHousehold = async (name: string) =>
    (await api.put<HouseholdDetail>(API_ENDPOINTS.HOUSEHOLD.UPDATE, { name })).data

  const getMembers = async () => (await api.get<HouseholdMember[]>(API_ENDPOINTS.HOUSEHOLD.MEMBERS)).data ?? []
  const updateMember = async (membershipId: number, role: HouseholdRoleValue, personId: number | null) =>
    (await api.put<HouseholdMember>(API_ENDPOINTS.HOUSEHOLD.MEMBER(membershipId), { role, personId })).data
  const removeMember = async (membershipId: number) => api.delete(API_ENDPOINTS.HOUSEHOLD.MEMBER(membershipId))

  // Ayrılınca yeni aktif hane refresh'te seçilir; tam yenileme
  const leaveHousehold = async () => {
    await api.post(API_ENDPOINTS.HOUSEHOLD.LEAVE, {})
    reloadToDashboard()
  }

  const getInvitations = async () =>
    (await api.get<HouseholdInvitation[]>(API_ENDPOINTS.HOUSEHOLD.INVITATIONS)).data ?? []
  // Hatalar pencerede gösterilir (toast yok)
  const createInvitation = async (email: string, role: HouseholdRoleValue, personId: number | null) =>
    (await api.post<HouseholdInvitationSendResult>(API_ENDPOINTS.HOUSEHOLD.INVITATIONS, { email, role, personId }, { silent: true })).data
  const resendInvitation = async (id: number) =>
    (await api.post<HouseholdInvitationSendResult>(API_ENDPOINTS.HOUSEHOLD.RESEND_INVITATION(id), {})).data
  const revokeInvitation = async (id: number) => api.delete(API_ENDPOINTS.HOUSEHOLD.INVITATION(id))

  // Aktif haneyi kalıcı olarak siler; başarıda /dashboard'a tam yenileme (refresh başka hane seçer ya da null).
  // Hatalar çağırana bırakılır (bölümde gösterilir)
  const deleteHousehold = async (password: string, confirmName: string) => {
    const { $api } = useNuxtApp()
    await $api.delete(API_ENDPOINTS.HOUSEHOLD.DELETE, { data: { password, confirmName } })
    reloadToDashboard()
  }

  const invitationStatusLabel = (status: InvitationStatus) =>
    ({ Pending: 'Bekliyor', Accepted: 'Kabul edildi', Revoked: 'İptal edildi', Expired: 'Süresi doldu' })[status] ?? status
  //#endregion

  return {
    activeTenant, memberships, getRoleLabel, switchHousehold, createHousehold, getInvitation, acceptInvitation,
    getHousehold, updateHousehold, getMembers, updateMember, removeMember, leaveHousehold,
    getInvitations, createInvitation, resendInvitation, revokeInvitation, invitationStatusLabel, deleteHousehold
  }
}
