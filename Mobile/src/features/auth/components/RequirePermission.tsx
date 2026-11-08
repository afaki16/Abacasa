import type { ReactNode } from 'react';

import { StateView } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

import { hasPermission } from '../permissions';

/**
 * Ekran düzeyinde yetki kapısı. Yetkiler açılışta /me ile gelir; o ana kadar "yetkin yok"
 * yerine yükleniyor gösterilir. Asıl kontrol backend'dedir — bu yalnızca arayüz.
 *
 *   <RequirePermission permission="Users.Read">…ekran…</RequirePermission>
 */
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const isUserVerified = useAuthStore((s) => s.isUserVerified);
  const allowed = useAuthStore((s) => hasPermission(s.user, permission));

  if (!isUserVerified) return <StateView kind="loading" />;
  if (!allowed) return <StateView kind="forbidden" />;
  return <>{children}</>;
}
