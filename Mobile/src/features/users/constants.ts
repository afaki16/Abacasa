import type { Option } from '@/components/ui';
import { Colors } from '@/constants/theme';
import type { UserStatus } from '@/features/auth/types';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  Active: 'Aktif',
  Inactive: 'Pasif',
  Banned: 'Engelli',
  PendingVerification: 'Doğrulama bekliyor',
};

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  Active: Colors.success,
  Inactive: Colors.textMuted,
  Banned: Colors.danger,
  PendingVerification: Colors.primary,
};

/** Formda seçilebilen durumlar ("Doğrulama bekliyor" sistem durumudur, elle seçilmez). */
export const USER_STATUS_OPTIONS: Option<UserStatus>[] = [
  { value: 'Active', label: 'Aktif', description: 'Giriş yapabilir.' },
  { value: 'Inactive', label: 'Pasif', description: 'Giriş yapamaz; kayıt silinmez.' },
  { value: 'Banned', label: 'Engelli', description: 'Hesap kilitli.' },
];

/** Yetki adları (backend PermissionDto.Name). */
export const USER_PERMISSIONS = {
  READ: 'Users.Read',
  CREATE: 'Users.Create',
  UPDATE: 'Users.Update',
  DELETE: 'Users.Delete',
} as const;
