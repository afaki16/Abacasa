import type { HouseholdRole } from './user'

export type InvitationStatus = 'Pending' | 'Accepted' | 'Revoked' | 'Expired'

/** Rol gönderiminde backend enum değeri */
export enum HouseholdRoleValue {
  Admin = 1,
  Member = 2
}

export interface HouseholdDetail {
  id: number
  name: string
  createdDate: string
  memberCount: number
}

export interface HouseholdMember {
  membershipId: number
  userId: number
  fullName: string
  email: string
  role: HouseholdRole
  personId?: number | null
  personName?: string | null
  joinedAt: string
  isCurrentUser: boolean
}

export interface HouseholdInvitation {
  id: number
  email: string
  role: HouseholdRole
  personId?: number | null
  personName?: string | null
  status: InvitationStatus
  expiresAt: string
  createdDate: string
}

/** Davet oluşturma / yeniden gönderme sonucu; e-posta gitmese de davet geçerlidir */
export interface HouseholdInvitationSendResult extends HouseholdInvitation {
  emailSent: boolean
}

/** Token sahibine gösterilen davet özeti */
export interface InvitationInfo {
  householdName: string
  inviterName: string
  email: string
  role: HouseholdRole
  status: InvitationStatus
  userExists: boolean
}

export interface HouseholdRef {
  id: number
  name: string
}

/** Hesap silme önizlemesi */
export interface AccountDeletionPreview {
  /** Son yönetici olunan ve başka canlı üyesi olan haneler (silme engellenir) */
  blockedHouseholds: HouseholdRef[]
  /** Tek canlı üyesi olunan haneler (hesapla birlikte silinir) */
  householdsToDelete: HouseholdRef[]
  isLastSuperAdmin: boolean
}
