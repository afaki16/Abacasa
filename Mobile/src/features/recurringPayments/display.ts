// Sabit ödeme satırlarının görünen metinleri ve durumu (saf; çeviri lib/i18n'den).
// Ödenme durumu saklanmaz: vade isPaid (bağlı canlı kayıt) ve bugüne göre hesaplanır.

import type { IconName } from '@/components/ui';
import type { RecurringPaymentKind } from '@/lib/domain/enums';
import { currentLocale, t } from '@/lib/i18n';
import { formatMoney } from '@/lib/format/money';
import { daysBetween, formatShortDate } from '@/lib/format/period';

import { installmentAmount } from './planForm';
import type { RecurringPaymentListItem, RecurringPaymentOccurrence } from './types';

export type OccurrenceStatus = 'paid' | 'pending' | 'overdue';

/** Ödendi; ödenmemiş ve vadesi geçmiş → Gecikti; diğerleri Bekliyor. */
export function occurrenceStatus(
  o: Pick<RecurringPaymentOccurrence, 'isPaid' | 'dueDate'>,
  today: string,
): OccurrenceStatus {
  if (o.isPaid) return 'paid';
  return daysBetween(today, o.dueDate.slice(0, 10)) < 0 ? 'overdue' : 'pending';
}

export const STATUS_BADGE: Record<OccurrenceStatus, 'paid' | 'pending' | 'overdue'> = {
  paid: 'paid',
  pending: 'pending',
  overdue: 'overdue',
};

const KIND_ICONS: Record<RecurringPaymentKind, IconName> = {
  Subscription: 'autorenew',
  Bill: 'receipt-long',
  Installment: 'credit-card',
  Donation: 'volunteer-activism',
};

export const kindIcon = (kind: RecurringPaymentKind): IconName =>
  KIND_ICONS[kind] ?? 'event-repeat';

/** Türkçe "ayın 8'i" eki: son rakamın (ya da onluğun) okunuşuna göre. */
export function trDaySuffix(day: number): string {
  const last = day % 10;
  if (last === 0) return day === 20 ? 'si' : 'u'; // on-u, yirmi-si, otuz-u
  return ['', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u'][last];
}

function enOrdinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  return `${day}${['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'}`;
}

/** "her ayın 8'i" / "every month on the 8th". */
export function dueDayText(day: number): string {
  return currentLocale() === 'en'
    ? t('recurring.plan.everyMonth', { day: enOrdinal(day) })
    : t('recurring.plan.everyMonth', { day: `${day}’${trDaySuffix(day)}` });
}

/** Vade satırının ikinci satırı: taksit no, vade / ödeme bilgisi, tutar durumu. */
export function occurrenceMeta(o: RecurringPaymentOccurrence, today: string): string {
  const parts: string[] = [];
  if (o.installmentNo != null && o.installmentCount != null) {
    parts.push(
      t('recurring.occurrence.installment', { no: o.installmentNo, count: o.installmentCount }),
    );
  }
  const status = occurrenceStatus(o, today);
  const due = o.dueDate.slice(0, 10);
  if (status === 'paid') {
    parts.push(
      o.paidDate
        ? t('recurring.occurrence.paidOn', { date: formatShortDate(o.paidDate) })
        : t('recurring.status.paid'),
    );
  } else if (status === 'overdue') {
    parts.push(t('recurring.occurrence.due', { date: formatShortDate(due) }));
    parts.push(t('recurring.occurrence.daysLate', { days: daysBetween(due, today) }));
  } else if (due === today) {
    parts.push(t('recurring.occurrence.dueToday', { date: formatShortDate(due) }));
  } else {
    parts.push(t('recurring.occurrence.due', { date: formatShortDate(due) }));
  }
  if (status !== 'paid') {
    if (o.amount == null) parts.push(t('recurring.occurrence.unknownAmount'));
    else if (o.isEstimated) parts.push(t('recurring.occurrence.estimated'));
  }
  return parts.join(' · ');
}

/** Satırdaki tutar: ödendiyse ödenen, değilse beklenen/tahmini ("≈"), bilinmiyorsa "—". */
export function occurrenceAmountText(o: RecurringPaymentOccurrence): string {
  if (o.isPaid) return formatMoney(o.paidAmount ?? o.amount);
  if (o.amount == null) return '—';
  return o.isEstimated ? `≈ ${formatMoney(o.amount)}` : formatMoney(o.amount);
}

/** Bekleyenler vadeye göre önce, ödenenler sonra (o da vadeye göre). */
export function sortOccurrences(items: RecurringPaymentOccurrence[]): RecurringPaymentOccurrence[] {
  return [...items].sort((a, b) => {
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
  });
}

export function countByPaid(items: RecurringPaymentOccurrence[]): {
  paid: number;
  pending: number;
} {
  const paid = items.filter((o) => o.isPaid).length;
  return { paid, pending: items.length - paid };
}

/** Plan satırının ikinci satırı: "Aylık · her ayın 8’i", "Taksitli · 12 taksit", "Bağış · Aylık · …". */
export function planMeta(p: RecurringPaymentListItem): string {
  const parts: string[] = [];
  if (p.kind === 'Installment') {
    parts.push(t('recurring.plan.installmentShort'));
    if (p.installmentCount != null)
      parts.push(t('recurring.plan.installmentCount', { count: p.installmentCount }));
  } else {
    if (p.kind === 'Donation') parts.push(t('recurring.group.donation'));
    parts.push(t('recurring.schedule.monthly'));
    parts.push(
      p.expectedAmount == null ? t('recurring.plan.variableAmount') : dueDayText(p.dueDay),
    );
  }
  return parts.join(' · ');
}

/** Plan tutarı: aylık beklenen, taksitte aylık taksit; belli değilse "—". */
export function planAmountText(p: RecurringPaymentListItem): string {
  if (p.kind === 'Installment')
    return formatMoney(installmentAmount(p.totalAmount, p.installmentCount));
  return formatMoney(p.expectedAmount);
}
