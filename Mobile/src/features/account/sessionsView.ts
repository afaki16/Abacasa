// Oturum listesinin görünüm modeli (Oturumlar ekranı). Saf; testlidir.
// Backend boş alanları "Unknown" yazar; bunlar gösterilmez.

import type { IconName } from '@/components/ui/Icon';
import type { Session } from '@/features/auth/types';

export type SessionStatus = 'active' | 'revoked' | 'expired';

export interface SessionRowModel {
  id: number;
  /** Cihaz adı; bilinmiyorsa null (ekran "Bilinmeyen cihaz" yazar). */
  name: string | null;
  icon: IconName;
  /** Konum, yoksa IP; ikisi de yoksa null. */
  place: string | null;
  isThisDevice: boolean;
  status: SessionStatus;
  createdDate: string;
  expiryDate: string;
}

export interface SessionOverview {
  active: SessionRowModel[];
  history: SessionRowModel[];
}

export const HISTORY_LIMIT = 10;

/** "Unknown", boş ve boşluk → null. */
export function cleanSessionText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return !trimmed || trimmed.toLowerCase() === 'unknown' ? null : trimmed;
}

/** JwtService.GetDeviceType: Mobile / Tablet / Desktop / Unknown (iPad "Mobile" gelir; addan ayırt edilir). */
export function sessionDeviceIcon(
  deviceType: string | null | undefined,
  deviceName: string | null | undefined,
): IconName {
  const type = cleanSessionText(deviceType)?.toLowerCase();
  const name = cleanSessionText(deviceName)?.toLowerCase() ?? '';
  if (type === 'tablet' || name.includes('ipad') || name.includes('tablet')) return 'tablet-android';
  if (type === 'desktop' || name.startsWith('web')) return 'laptop';
  if (type === 'mobile') return 'smartphone';
  return 'devices';
}

const time = (iso: string) => Date.parse(iso);

export function toSessionRow(session: Session, deviceId: string | null, now: number): SessionRowModel {
  const status: SessionStatus = session.isActive
    ? 'active'
    : time(session.expiryDate) <= now
      ? 'expired'
      : 'revoked';
  return {
    id: session.id,
    name: cleanSessionText(session.deviceName),
    icon: sessionDeviceIcon(session.deviceType, session.deviceName),
    place: cleanSessionText(session.location) ?? cleanSessionText(session.ipAddress),
    isThisDevice: session.isActive && !!deviceId && cleanSessionText(session.deviceId) === deviceId,
    status,
    createdDate: session.createdDate,
    expiryDate: session.expiryDate,
  };
}

/** Aktifler: bu cihaz önce, sonra yeniden eskiye. Geçmiş: yeniden eskiye, en fazla `historyLimit`. */
export function buildSessionOverview(
  sessions: Session[],
  deviceId: string | null,
  now: number,
  historyLimit = HISTORY_LIMIT,
): SessionOverview {
  const rows = sessions.map((s) => toSessionRow(s, deviceId, now));
  const newestFirst = (a: SessionRowModel, b: SessionRowModel) => time(b.createdDate) - time(a.createdDate);
  const active = rows
    .filter((r) => r.status === 'active')
    .sort((a, b) =>
      a.isThisDevice !== b.isThisDevice ? Number(b.isThisDevice) - Number(a.isThisDevice) : newestFirst(a, b),
    );
  const history = rows
    .filter((r) => r.status !== 'active')
    .sort(newestFirst)
    .slice(0, historyLimit);
  return { active, history };
}

export type RelativeTime =
  | { unit: 'justNow' }
  | { unit: 'minutes' | 'hours' | 'days'; count: number }
  | { unit: 'date'; iso: string };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Az önce", "5 dakika önce", "2 saat önce", "3 gün önce"; 30 günden eskiyse tarih. */
export function relativeTime(iso: string, now: number): RelativeTime {
  const diff = Math.max(0, now - time(iso));
  if (diff < MINUTE) return { unit: 'justNow' };
  if (diff < HOUR) return { unit: 'minutes', count: Math.floor(diff / MINUTE) };
  if (diff < DAY) return { unit: 'hours', count: Math.floor(diff / HOUR) };
  if (diff < 30 * DAY) return { unit: 'days', count: Math.floor(diff / DAY) };
  return { unit: 'date', iso };
}
