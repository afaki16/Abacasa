// Araç listesi ve detayındaki hatırlatma rozetleri, güncel işlem ve yıl gideri (saf fonksiyonlar).
// Hatırlatmalar yalnızca listede görünür, hiçbir toplama girmez. Pasif araçlar hatırlatma göstermez.

import type { IconName } from '@/components/ui';
import type { VehicleObligationType } from '@/lib/domain/enums';
import { daysBetween } from '@/lib/format/period';

import type { Vehicle, VehicleObligation } from './types';

/** Backend hatırlatma penceresi (geçerlilik sonu bugünden 30 gün içinde ya da geçmiş). */
export const REMINDER_WINDOW_DAYS = 30;
/** Bu kadar gün ve altı "yaklaşıyor" (turuncu); pencerenin kalanı nötr. */
export const URGENT_DAYS = 15;

export const OBLIGATION_TYPES: readonly VehicleObligationType[] = [
  'Inspection',
  'TrafficInsurance',
  'Kasko',
  'Mtv',
  'Maintenance',
];

export const OBLIGATION_ICONS: Record<VehicleObligationType, IconName> = {
  Inspection: 'fact-check',
  TrafficInsurance: 'shield',
  Kasko: 'verified-user',
  Mtv: 'receipt-long',
  Maintenance: 'build',
};

export type DueTone = 'overdue' | 'pending' | 'neutral';

export function dueTone(daysLeft: number): DueTone {
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= URGENT_DAYS) return 'pending';
  return 'neutral';
}

/**
 * Araç kartı rozeti:
 * - pasif: 'inactive' (hatırlatma yok)
 * - güncel kaydı yok: 'none'
 * - en yakın geçerlilik sonu pencere içinde/geçmişte: 'due' (tür, kalan gün, ton)
 * - değilse: 'next' (en yakın tür ve tarihi; nötr)
 */
export type VehicleBadge =
  | { kind: 'inactive' }
  | { kind: 'none' }
  | { kind: 'due'; type: VehicleObligationType; daysLeft: number; tone: DueTone }
  | { kind: 'next'; type: VehicleObligationType; validUntil: string };

export function vehicleBadge(
  vehicle: Pick<Vehicle, 'isActive' | 'current'>,
  today: string,
): VehicleBadge {
  if (!vehicle.isActive) return { kind: 'inactive' };
  if (vehicle.current.length === 0) return { kind: 'none' };
  const nearest = [...vehicle.current].sort((a, b) => a.validUntil.localeCompare(b.validUntil))[0];
  const daysLeft = daysBetween(today, nearest.validUntil);
  if (daysLeft <= REMINDER_WINDOW_DAYS)
    return { kind: 'due', type: nearest.type, daysLeft, tone: dueTone(daysLeft) };
  return { kind: 'next', type: nearest.type, validUntil: nearest.validUntil };
}

/** Her tür için güncel işlem (geçerlilik sonu en geç olan; eşitse tarihi/id'si yeni olan). */
export function currentObligationIds(obligations: readonly VehicleObligation[]): Set<number> {
  const best = new Map<VehicleObligationType, VehicleObligation>();
  for (const o of obligations) {
    const prev = best.get(o.type);
    const newer =
      !prev ||
      o.validUntil > prev.validUntil ||
      (o.validUntil === prev.validUntil &&
        (o.date > prev.date || (o.date === prev.date && o.id > prev.id)));
    if (newer) best.set(o.type, o);
  }
  return new Set([...best.values()].map((o) => o.id));
}

/** Güncel işlemin rozeti (pencere içinde ya da geçmişse); değilse null. */
export function obligationDue(
  obligation: Pick<VehicleObligation, 'validUntil'>,
  isCurrent: boolean,
  vehicleActive: boolean,
  today: string,
): { daysLeft: number; tone: DueTone } | null {
  if (!isCurrent || !vehicleActive) return null;
  const daysLeft = daysBetween(today, obligation.validUntil);
  return daysLeft <= REMINDER_WINDOW_DAYS ? { daysLeft, tone: dueTone(daysLeft) } : null;
}

/** Yıl içinde (işlem tarihine göre) girilen tutarların toplamı. */
export function obligationYearTotal(
  obligations: readonly VehicleObligation[],
  year: number,
): number {
  const prefix = `${year}-`;
  return obligations.reduce(
    (acc, o) => (o.date.startsWith(prefix) ? acc + (o.amount ?? 0) : acc),
    0,
  );
}

/** Tür filtresi + tarihe göre yeniden eskiye. */
export function filterObligations(
  obligations: readonly VehicleObligation[],
  type: VehicleObligationType | null,
): VehicleObligation[] {
  return obligations
    .filter((o) => type === null || o.type === type)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

/** 'YYYY-MM-DD' + n yıl (29 Şubat → 28 Şubat); yeni işlemde varsayılan geçerlilik sonu. */
export function addYears(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const year = y + n;
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return `${year}-${String(m).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}
