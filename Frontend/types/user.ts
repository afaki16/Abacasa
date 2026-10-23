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
  profileImageUrl?: string
  createdDate: string
  /** Son aktif hane; erişim vermez (erişim memberships'ten). */
  tenantId?: number
  /** Oturumun aktif hanesi; üyelik yoksa null */
  activeTenant?: UserActiveTenant | null
  memberships?: UserMembership[]
  /** Yalnızca sistem rolleri */
  roles: any[]
  /** Sistem izinleri + aktif hanedeki üyelik rolünün hane izinleri */
  permissions: any[]
}

export type HouseholdRole = 'Admin' | 'Member'

export interface UserActiveTenant {
  id: number
  name: string
  role: HouseholdRole
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
  password: string
  phoneNumber?: string
  status: UserStatus
  roleIds: string[]
  /** Sadece SuperAdmin belirtebilir. Belirtilmezse mevcut kullanıcının tenant'ı kullanılır. */
  tenantId?: number
}

export interface UpdateUserRequest {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  status: UserStatus
  profileImageUrl?: string
  roleIds: string[]
}

export enum UserStatus {
  Active = 1,
  Inactive = 2,
  Banned = 3,
  PendingVerification = 4
}
