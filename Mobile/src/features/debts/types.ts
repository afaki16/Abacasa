// Backend: Abacasa.Application/Features/Debts/Dtos (DebtListDto, DebtDto, Create/UpdateDebtDto, DebtSummaryDto,
// DebtPaymentDto, SaveDebtPaymentDto) ve ExchangeRates/Dtos/CurrentRateDto (özetteki güncel kurlar).

import type { Currency } from '@/lib/domain/enums';

/** Kurun kaynağı: TCMB (günlük otomatik) ya da hanenin elle girdiği kur. */
export type RateSource = 'TCMB' | 'Elle';

/** Bir birimin güncel kuru: TCMB ile elle kurdan tarihi yeni olan (eşitse elle). */
export interface DebtCurrentRate {
  currency: Currency;
  rate: number;
  date: string;
  source: RateSource;
}

/** GET /api/Debts (liste öğesi). Ödenen/kalan alanları hesaplanır, saklanmaz. */
export interface DebtListItem {
  id: number;
  creditorPersonId: number;
  creditorName: string;
  /** Boşsa borçlu hanedir. */
  debtorPersonId: number | null;
  debtorName: string | null;
  currency: Currency;
  /** Borcun kendi para biriminde. */
  amount: number;
  /** 'YYYY-MM-DD' */
  date: string;
  note: string | null;
  paidAmount: number;
  remaining: number;
  isClosed: boolean;
  paidInTry: number;
  /** Yabancı birimde kur yoksa null. */
  remainingInTry: number | null;
  paymentCount: number;
  /** Ödemesi varsa para birimi değiştirilemez ve borç silinemez. */
  hasPayments: boolean;
  createdDate: string;
}

/** GET /api/Debts/{id}: liste alanları + denetim alanları (listeden placeholder için opsiyonel). */
export interface DebtDetail extends DebtListItem {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

export interface DebtListParams {
  searchTerm?: string;
  isClosed?: boolean;
  creditorPersonId?: number;
  currency?: Currency;
}

export interface CreateDebtRequest {
  creditorPersonId: number;
  debtorPersonId?: number | null;
  currency: Currency;
  amount: number;
  date: string;
  note?: string | null;
}

export interface UpdateDebtRequest extends CreateDebtRequest {
  id: number;
}

export interface DebtSummaryForeign {
  currency: Currency;
  open: number;
  rate: { rate: number; date: string; source: RateSource } | null;
  /** Kur yoksa null. */
  openInTry: number | null;
}

export interface DebtCreditorTotal {
  personId: number;
  name: string;
  openTry: number;
  foreign: { currency: Currency; open: number; openInTry: number | null }[];
  totalInTry: number | null;
}

/** GET /api/Debts/summary */
export interface DebtSummary {
  openTry: number;
  /** Yalnızca açığı > 0 olan yabancı birimler. */
  foreign: DebtSummaryForeign[];
  /** Açığı olan bir birimin kuru yoksa null. */
  openTotalInTry: number | null;
  paidTotalInTry: number;
  openCount: number;
  /** USD, EUR ve çeyreğin güncel kurları (kuru olmayan yok). */
  rates: DebtCurrentRate[];
  byCreditor: DebtCreditorTotal[];
}

export interface DebtPayment {
  id: number;
  debtId: number;
  date: string;
  /** Borcun para biriminde. */
  amount: number;
  exchangeRate: number | null;
  /** TL'de tutarın kendisi, yabancı birimde tutar × kur. */
  amountInTry: number;
  note: string | null;
  createdDate: string;
}

/** Ödeme ekleme ve güncelleme ortak gövdesi. Ödeme kuru her zaman elle girilir. */
export interface SaveDebtPaymentRequest {
  date: string;
  amount: number;
  /** Yalnızca yabancı birimde (döviz kuru ya da çeyrek fiyatı). */
  exchangeRate?: number | null;
  note?: string | null;
}

export interface CreateDebtPaymentVariables extends SaveDebtPaymentRequest {
  debtId: number;
}

export interface UpdateDebtPaymentVariables extends SaveDebtPaymentRequest {
  debtId: number;
  paymentId: number;
}

export interface DeleteDebtPaymentVariables {
  debtId: number;
  paymentId: number;
}
