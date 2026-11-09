// Özet: yaklaşan ödemeler ve araç hatırlatmaları (Dashboard.upcoming). Saf; testlidir.
// Hatırlatmalar yalnızca listede; hiçbir toplama girmez.

import { daysBetween } from '@/lib/format/period';

import type { DashboardUpcomingItem } from './types';

/** overdue: gecikti · today: bugün · soon: yakın (≤ 14 gün) · later: daha uzak. */
export type DueTone = 'overdue' | 'today' | 'soon' | 'later';

export interface DueInfo {
  tone: DueTone;
  /** Gecikmede geçen, değilse kalan gün (≥ 0). */
  days: number;
}

/** Araç hatırlatmasında "yakın" sayılan gün. */
export const SOON_DAYS = 14;

export function dueInfo(item: Pick<DashboardUpcomingItem, 'dueDate' | 'isOverdue'>, today: string): DueInfo {
  const diff = daysBetween(today, item.dueDate);
  if (item.isOverdue || diff < 0) return { tone: 'overdue', days: Math.max(0, -diff) };
  if (diff === 0) return { tone: 'today', days: 0 };
  return { tone: diff <= SOON_DAYS ? 'soon' : 'later', days: diff };
}

/** Sabit ödeme vadeleri ve araç hatırlatmaları ayrı listeler (sunucunun vade sırası korunur). */
export function splitUpcoming(items: DashboardUpcomingItem[]): {
  recurring: DashboardUpcomingItem[];
  vehicles: DashboardUpcomingItem[];
} {
  return {
    recurring: items.filter((i) => i.source === 'recurring'),
    vehicles: items.filter((i) => i.source === 'vehicle'),
  };
}

/** Liste anahtarı (aynı ödemenin birden çok vadesi olabilir). */
export function upcomingKey(item: DashboardUpcomingItem): string {
  return `${item.source}-${item.recurringPaymentId ?? item.vehicleId}-${item.obligationType ?? ''}-${item.dueDate}`;
}
