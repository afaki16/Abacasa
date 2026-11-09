// Backend auth sözleşmesi (Abacasa.Application/Features/Auth/Dtos, Users/Dtos/UserDto).

export interface Permission {
  id: number;
  /** Kanonik yetki adı ("Users.Read", "Users.Export"). Yetki kontrolünde bu kullanılır. */
  name: string;
  fullPermission?: string;
  resource?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  isSystemRole: boolean;
}

export type UserStatus = 'Inactive' | 'Active' | 'Banned' | 'PendingVerification';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  status: UserStatus;
  emailConfirmed: boolean;
  profileImageUrl?: string | null;
  tenantId: number | null;
  mustChangePassword: boolean;
  roles: Role[];
  /** Sistem izinleri + aktif hanedeki üyelik rolünün izinleri (hane izinleri yalnızca aktif haneden). */
  permissions: Permission[];
  /** Aktif hane (User.TenantId); hiç hanesi yoksa null. */
  activeTenant?: ActiveHousehold | null;
  /** Üye olunan haneler (hane seçici). */
  memberships?: HouseholdMembership[];
  /** Onay bekleyen yasal metinler ("Terms" / "PrivacyNotice"); doluysa onay ekranı açılır. */
  pendingConsents?: ConsentDocument[];
}

export type HouseholdRole = 'Admin' | 'Member';

export interface ActiveHousehold {
  id: number;
  name: string;
  role: HouseholdRole;
  modules: { donationExtras: boolean };
}

export interface HouseholdMembership {
  tenantId: number;
  name: string;
  role: HouseholdRole;
}

export type ConsentDocument = 'Terms' | 'PrivacyNotice';

/**
 * Cihazda saklanan minimum kullanıcı. Roller/yetkiler SAKLANMAZ — yalnızca bellekte
 * tutulur ve açılışta /me ile tazelenir (bayat yetkiyle arayüz açılmasın).
 */
export type StoredUser = Pick<
  User,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phoneNumber'
  | 'profileImageUrl'
  | 'tenantId'
  | 'mustChangePassword'
  | 'activeTenant'
>;

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
  tenantId?: number;
  deviceId: string;
  deviceName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string | null;
  /** Kayıtla açılacak hane (davetle kayıtta boş). E-posta doğrulanınca oluşturulur. */
  householdName: string;
  acceptTerms: boolean;
  acknowledgePrivacy: boolean;
  /** Davetle kayıt: e-posta doğrulanmış sayılır, hane açılmaz (householdName gerekmez). */
  inviteToken?: string | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

/** GET /api/Auth/sessions (SessionDto). `isCurrentSession` backend'de henüz hesaplanmıyor — deviceId ile bulunur. */
export interface Session {
  id: number;
  createdDate: string;
  expiryDate: string;
  isActive: boolean;
  ipAddress: string | null;
  deviceId: string | null;
  deviceName: string | null;
  deviceType: string | null;
  location: string | null;
}
