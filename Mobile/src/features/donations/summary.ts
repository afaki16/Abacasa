// Bağış özeti ve satır metinleri (saf). Emanetten dağıtılan bağışlar toplama girmez (backend özeti
// zaten ayırır); listede "Emanetten" diye işaretlenir.

import type { DonationKind } from '@/lib/domain/enums';
import { enumLabel } from '@/lib/domain/enums';
import { t } from '@/lib/i18n';
import { formatShortDate } from '@/lib/format/period';

import type { DonationListItem, DonationSummary } from './types';

/** Yılın tamamı (1 Ocak – 31 Aralık). */
export function yearPeriod(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Yıl seçici seçenekleri: bu yıldan geriye `back` yıl ve bir sonraki yıl (yeniden eskiye). */
export function yearOptions(currentYear: number, back = 5): number[] {
  const years: number[] = [];
  for (let y = currentYear + 1; y >= currentYear - back; y--) years.push(y);
  return years;
}

export interface BreakdownRow {
  key: string;
  label: string;
  total: number;
  count: number;
  /** 0–1 (toplam içindeki pay). */
  share: number;
}

const share = (value: number, total: number) => (total > 0 ? value / total : 0);

/** Yüzde metni (tam sayı): 0.476 → "48%" / "%48". */
export function percentText(value: number): string {
  return t('donations.percent', { value: Math.round(value * 100) });
}

/** Türe göre kırılım; büyükten küçüğe. */
export function kindBreakdown(summary: Pick<DonationSummary, 'byKind' | 'total'>): BreakdownRow[] {
  return [...summary.byKind]
    .filter((k) => k.total > 0 || k.count > 0)
    .sort((a, b) => b.total - a.total)
    .map((k) => ({
      key: k.kind,
      label: enumLabel('donationKind', k.kind),
      total: k.total,
      count: k.count,
      share: share(k.total, summary.total),
    }));
}

/** Verene göre kırılım; kişisi olmayan bağış hanenindir. */
export function giverBreakdown(
  summary: Pick<DonationSummary, 'byGiver' | 'total'>,
  householdLabel: string,
): BreakdownRow[] {
  return [...summary.byGiver]
    .filter((g) => g.total > 0 || g.count > 0)
    .sort((a, b) => b.total - a.total)
    .map((g) => ({
      key: String(g.personId ?? 'household'),
      label: g.personName ?? householdLabel,
      total: g.total,
      count: g.count,
      share: share(g.total, summary.total),
    }));
}

/** Satırın ikinci satırı: "5 Kas · Ayşe → Elif Kaya", emanettense "· Emanetten". */
export function donationMeta(
  d: Pick<DonationListItem, 'date' | 'giverPersonName' | 'recipient' | 'fundId'>,
  householdLabel: string,
): string {
  const parts = [
    formatShortDate(d.date),
    `${d.giverPersonName ?? householdLabel} → ${d.recipient}`,
  ];
  if (d.fundId != null) parts.push(t('donations.fromFund'));
  return parts.join(' · ');
}

export const donationKindTitle = (kind: DonationKind) => enumLabel('donationKind', kind);
