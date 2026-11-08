// Backend: Abacasa.Application/Features/Households/Dtos (HouseholdDtos.cs, HouseholdManagementDtos.cs)
// ve UserActiveTenantDto.Modules (HouseholdModulesDto).

import type { HouseholdRole } from '@/lib/domain/enums';

/** Davet durumu (backend string döner). lib/domain/enums'ta olmadığı için burada. */
export type InvitationStatus = 'Pending' | 'Accepted' | 'Revoked' | 'Expired';

/** GET/PUT /api/Household: aktif hane. */
export interface HouseholdDetail {
  id: number;
  name: string;
  createdDate: string;
  memberCount: number;
}

/** POST /api/Households yanıtı. */
export interface HouseholdRef {
  id: number;
  name: string;
}

/** Açılıp kapatılabilen modüller (kapatınca veri silinmez). */
export interface HouseholdModules {
  /** Bağış hedefleri ve emanetler. */
  donationExtras: boolean;
}

export interface HouseholdMember {
  membershipId: number;
  userId: number;
  fullName: string;
  email: string;
  role: HouseholdRole;
  /** Üyenin hanedeki kişi kaydı (harcama sahibi vb.); boş olabilir. */
  personId: number | null;
  personName: string | null;
  joinedAt: string;
  isCurrentUser: boolean;
}

export interface HouseholdInvitation {
  id: number;
  email: string;
  role: HouseholdRole;
  personId: number | null;
  personName: string | null;
  status: InvitationStatus;
  /** 7 gün geçerli. */
  expiresAt: string;
  createdDate: string;
}

/** Davet oluşturma / yeniden gönderme sonucu; e-posta gitmese de davet geçerlidir. */
export interface HouseholdInvitationSendResult extends HouseholdInvitation {
  emailSent: boolean;
}

/** GET /api/Invitations/{token}: token sahibine davet özeti (anonim). */
export interface InvitationInfo {
  householdName: string;
  inviterName: string;
  email: string;
  role: HouseholdRole;
  status: InvitationStatus;
  /** Bu e-postayla hesap var mı (giriş mi kayıt mı). */
  userExists: boolean;
}

export interface CreateHouseholdRequest {
  name: string;
}

export interface UpdateHouseholdRequest {
  name: string;
}

/** Kalıcı silme onayı: kullanıcının şifresi ve hane adının aynısı. */
export interface DeleteHouseholdRequest {
  password: string;
  confirmName: string;
}

export interface UpdateHouseholdMemberRequest {
  membershipId: number;
  role: HouseholdRole;
  /** null: üyelikten kişi bağı kaldırılır. */
  personId: number | null;
}

export interface CreateHouseholdInvitationRequest {
  email: string;
  role: HouseholdRole;
  personId: number | null;
}
