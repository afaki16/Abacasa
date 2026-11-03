export interface User {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber?: string
  status: UserStatus
  lastLoginDate?: string
  emailConfirmed: boolean
  phoneConfirmed: boolean
  profileImageUrl?: string | null
  createdDate: string
  /** Son aktif hane; erişim vermez (erişim memberships'ten). */
  tenantId?: number
  /** Kullanıcı listesi: canlı üyeliklerin hane adları (yalnızca SuperAdmin platform görünümünde dolu) */
  householdNames?: string[] | null
  /** Oturumun aktif hanesi; üyelik yoksa null */
  activeTenant?: UserActiveTenant | null
  memberships?: UserMembership[]
  /** Yalnızca sistem rolleri */
  roles: any[]
  /** Sistem izinleri + aktif hanedeki üyelik rolünün hane izinleri */
  permissions: any[]
  /** Onayı bekleyen belgeler (hiç onaylanmamış ya da sürümü eski) */
  pendingConsents?: ConsentDocument[]
  /** true ise kullanıcı şifresini değiştirmeden uygulamayı kullanamaz */
  mustChangePassword?: boolean
}

export type ConsentDocument = 'Terms' | 'PrivacyNotice'

export interface LegalVersions {
  termsVersion: string
  privacyNoticeVersion: string
}

export type HouseholdRole = 'Admin' | 'Member'

/** Hane modülleri (açık/kapalı) */
export interface HouseholdModules {
  /** Bağış hedefleri ve emanetler */
  donationExtras: boolean
}

export type HouseholdModuleName = keyof HouseholdModules

export interface UserActiveTenant {
  id: number
  name: string
  role: HouseholdRole
  modules?: HouseholdModules
}

export interface UserMembership {
  tenantId: number
  name: string
  role: HouseholdRole
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  /** sendAccountInvitation true ise gönderilmez */
  password?: string
  /** true ise kullanıcıya şifresini belirlemesi için hesap daveti e-postası gider (hane davetinden ayrı) */
  sendAccountInvitation?: boolean
  phoneNumber?: string
  status: UserStatus
  roleIds: string[]
  /** Sadece SuperAdmin belirtebilir. Belirtilmezse mevcut kullanıcının tenant'ı kullanılır. */
  tenantId?: number
  /** true ise kullanıcı ilk girişte şifresini değiştirmek zorunda kalır */
  mustChangePassword?: boolean
}

export interface UpdateUserRequest {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  status: UserStatus
  /** Gönderilmezse mevcut değer korunur */
  mustChangePassword?: boolean
  roleIds: string[]
}

// Backend Abacasa.Domain.Common.Enums.UserStatus; JsonStringEnumConverter ile isim olarak gelir
export enum UserStatus {
  Inactive = 'Inactive',
  Active = 'Active',
  Banned = 'Banned',
  PendingVerification = 'PendingVerification'
}
