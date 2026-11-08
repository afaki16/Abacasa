// Rol/yetki yardımcıları — yalnızca ARAYÜZ kararı içindir (buton gizle/göster).
// Asıl yetki kontrolü backend'dedir. Açılışta /me gelene kadar roller boştur, yani
// yetkili arayüz /me doğrulanmadan görünmez.

import { useAuthStore } from '@/stores/authStore';

import type { User } from './types';

export function getRoleNames(user: User | null): string[] {
  return user?.roles.map((r) => r.name).filter(Boolean) ?? [];
}

/** Web ile aynı kural: kanonik `name`; CRUD dışı yetkilerde fullPermission yanlıştır. */
export function getPermissionNames(user: User | null): string[] {
  return user?.permissions.map((p) => p.name ?? p.fullPermission).filter(Boolean) ?? [];
}

export function hasRole(user: User | null, role: string): boolean {
  return getRoleNames(user).includes(role);
}

export function hasPermission(user: User | null, permission: string): boolean {
  return getPermissionNames(user).includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  const names = getPermissionNames(user);
  return permissions.some((p) => names.includes(p));
}

/** Bileşenler için: <Button visible={useHasPermission('Users.Create')} /> */
export function useHasPermission(permission: string): boolean {
  return useAuthStore((s) => hasPermission(s.user, permission));
}
