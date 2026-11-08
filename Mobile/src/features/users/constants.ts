import type { ColorToken } from '@/constants/theme';
import type { UserStatus } from '@/features/auth/types';

// Durum adları ve açıklamaları çeviriden gelir: users.status.<durum>, users.statusDescription.<durum>.

/** Rozet rengi: tema token'ı (açık/koyu temada ayrı değer alır). */
export const USER_STATUS_COLORS: Record<UserStatus, ColorToken> = {
  Active: 'success',
  Inactive: 'textMuted',
  Banned: 'danger',
  PendingVerification: 'primary',
};

/** Formda seçilebilen durumlar ("Doğrulama bekliyor" sistem durumudur, elle seçilmez). */
export const SELECTABLE_USER_STATUSES: Exclude<UserStatus, 'PendingVerification'>[] = ['Active', 'Inactive', 'Banned'];

/** Yetki adları (backend PermissionDto.Name). */
export const USER_PERMISSIONS = {
  READ: 'Users.Read',
  CREATE: 'Users.Create',
  UPDATE: 'Users.Update',
  DELETE: 'Users.Delete',
} as const;
