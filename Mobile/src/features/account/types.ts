// Backend: Abacasa.Application/Features/Auth (AccountDeletionPlan, DeleteAccountRequestDto, RequestEmailChangeRequestDto).

/** HouseholdDto: hesap silme önizlemesindeki hane (üye sayısı gelmez). */
export interface AccountHouseholdRef {
  id: number;
  name: string;
}

/** GET /api/Auth/account/deletion-preview */
export interface AccountDeletionPreview {
  /** Son yönetici olunan ve başka üyesi olan haneler: önce başka bir üye yönetici yapılmalı. */
  blockedHouseholds: AccountHouseholdRef[];
  /** Tek üyesi olunan haneler: hesapla birlikte silinir. */
  householdsToDelete: AccountHouseholdRef[];
  /** Sistemdeki son SuperAdmin silinemez. */
  isLastSuperAdmin: boolean;
}

export interface DeleteAccountRequest {
  password: string;
  /** Tek üyesi olunan hanelerin de silinmesi onayı (önizlemede gösterildiyse true). */
  deleteSoleHouseholds: boolean;
}

/** PUT /api/Auth/profile/email: yeni adrese doğrulama bağlantısı gider; onaylanana kadar eski adres geçerli. */
export interface RequestEmailChangeRequest {
  newEmail: string;
  currentPassword: string;
}
