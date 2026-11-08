// Backend: Abacasa.Application/Features/Dashboard/Dtos/DashboardDto.cs (+ Debts/Dtos/DebtSummaryDto.cs).
// Dönem toplamı = gerçekleşen harcama + bağış + ödenmemiş sabit ödeme vadesi; yemek kartı ve borç hareketleri hariç.

import type {
  Currency,
  PaymentMethodType,
  RecurringPaymentKind,
  VehicleObligationType,
} from '@/lib/domain/enums';
import type { Period } from '@/lib/format/period';
import type { CurrentRate, CurrentRateSource } from '@/features/exchangeRates/types';

export interface DashboardParams {
  /** Takvim ayı ya da kart dönemi (start/end dahil). */
  period: Period;
  /** İstemcinin bugünü ('YYYY-MM-DD'); yaklaşanlar buna göre hesaplanır (sunucu saat dilimine bağlı kalmasın). */
  today: string;
}

/** Yemek kartı hariç gerçekleşen. */
export interface DashboardSpent {
  expenses: number;
  donations: number;
  total: number;
}

/** Yemek kartı hariç ödenmemiş vadeler; tutarı belli olmayanlar toplama girmez. */
export interface DashboardPending {
  total: number;
  count: number;
  unknownCount: number;
}

export interface DashboardMealCard {
  spent: number;
  pending: number;
  total: number;
}

/** Dönemdeki sabit ödeme vadeleri, yemek kartı hariç. */
export interface DashboardRecurring {
  paidTotal: number;
  pendingTotal: number;
  total: number;
  unknownCount: number;
}

/** Yemek kartı dahil; total'e göre azalan. */
export interface DashboardPaymentMethodRow {
  id: number;
  name: string;
  type: PaymentMethodType;
  spent: number;
  pending: number;
  total: number;
}

/** Yemek kartı hariç; personId null ise hane. Satırların toplamı outflowTotal. */
export interface DashboardPersonRow {
  personId: number | null;
  name: string | null;
  spent: number;
  pending: number;
  total: number;
}

// Borç özeti /api/Debts/summary ile aynı biçimdedir. Borç modülü ayrı yazıldığı için burada aynası tutulur.
export interface DashboardDebtRate {
  rate: number;
  date: string;
  source: CurrentRateSource;
}

export interface DashboardDebtForeignOpen {
  currency: Currency;
  open: number;
  /** Birimin güncel kuru; yoksa null. */
  rate: DashboardDebtRate | null;
  /** Kur yoksa null. */
  openInTry: number | null;
}

export interface DashboardDebtCreditor {
  personId: number;
  name: string;
  openTry: number;
  foreign: { currency: Currency; open: number; openInTry: number | null }[];
  /** Bir birimin kuru yoksa null. */
  totalInTry: number | null;
}

export interface DashboardDebtSummary {
  openTry: number;
  /** Yalnızca açığı > 0 olan yabancı birimler. */
  foreign: DashboardDebtForeignOpen[];
  /** Açığı olan bir birimin kuru yoksa null. */
  openTotalInTry: number | null;
  paidTotalInTry: number;
  openCount: number;
  /** USD, EUR ve çeyreğin güncel kurları (kuru olmayan yok). */
  rates: CurrentRate[];
  byCreditor: DashboardDebtCreditor[];
}

export type DashboardUpcomingSource = 'recurring' | 'vehicle';

/**
 * Ödenmemiş sabit ödeme vadeleri (bugün −60 … +30 gün) ve araç hatırlatmaları (geçerlilik sonu 30 gün içinde
 * ya da geçmiş); vadeye göre sıralı, hiçbir toplama girmez.
 */
export interface DashboardUpcomingItem {
  source: DashboardUpcomingSource;
  /** Araç satırında null. */
  recurringPaymentId: number | null;
  /** Yalnızca araç satırında. */
  vehicleId: number | null;
  /** Araç satırında "{Araç adı} · {Tür etiketi}". */
  name: string;
  /** Yalnızca sabit ödeme satırında. */
  kind: RecurringPaymentKind | null;
  /** Yalnızca araç satırında. */
  obligationType: VehicleObligationType | null;
  /** 'YYYY-MM-DD'; araç satırında geçerlilik sonu. */
  dueDate: string;
  /** null: tutar belli değil; araç satırında son tutar. */
  amount: number | null;
  isEstimated: boolean;
  /** Araç satırında null. */
  paymentMethodName: string | null;
  isOverdue: boolean;
}

/** GET /api/Dashboard */
export interface Dashboard {
  spent: DashboardSpent;
  pending: DashboardPending;
  /** spent.total + pending.total */
  outflowTotal: number;
  mealCard: DashboardMealCard;
  recurring: DashboardRecurring;
  byPaymentMethod: DashboardPaymentMethodRow[];
  byPerson: DashboardPersonRow[];
  /** Hanenin tamamı (dönemden bağımsız). */
  debts: DashboardDebtSummary;
  upcoming: DashboardUpcomingItem[];
}
