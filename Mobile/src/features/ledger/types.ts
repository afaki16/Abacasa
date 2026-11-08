// Backend: Abacasa.Application/Features/Ledger/Dtos (LedgerItemListDto, LedgerItemDto, Create/UpdateLedgerItemDto,
// LedgerYearDto, MonthlyAmountDto, SetMonthlyAmountDto).

import type { LedgerDirection, RecurringPaymentKind } from '@/lib/domain/enums';

/** Elle girilen gelir/gider kalemi. */
export interface LedgerItem {
  id: number;
  name: string;
  direction: LedgerDirection;
  /** Boşsa kalem hanenindir. */
  ownerPersonId: number | null;
  ownerName: string | null;
  isActive: boolean;
  /** Tutarı varsa yön değiştirilemez ve kalem silinemez. */
  hasAmounts: boolean;
  createdDate: string;
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

export interface CreateLedgerItemRequest {
  name: string;
  direction: LedgerDirection;
  ownerPersonId?: number | null;
}

export interface UpdateLedgerItemRequest extends CreateLedgerItemRequest {
  id: number;
  isActive: boolean;
}

/** Satır kaynağı (backend LedgerRowSource sabitleri). */
export type LedgerRowSource = 'manual' | 'plan' | 'category' | 'donations';

export interface LedgerRow {
  /** Benzersiz anahtar, ör. "manual-5". */
  key: string;
  source: LedgerRowSource;
  /** manual: kalem, plan: plan, category: kategori id'si; donations satırında null. */
  id: number | null;
  name: string;
  /** Yalnızca plan satırında. */
  kind: RecurringPaymentKind | null;
  ownerName: string | null;
  /** 12 ay; null "girilmemiş", 0 "0 girilmiş". */
  months: (number | null)[];
  total: number;
  monthsWithData: number;
  /** Verisi yoksa null. */
  average: number | null;
}

export interface LedgerTotals {
  incomeByMonth: number[];
  expenseByMonth: number[];
  netByMonth: number[];
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  incomeAverage: number;
  expenseAverage: number;
  netAverage: number;
}

/** GET /api/Ledger/year/{year}. Gelirler elle; gider tarafı otomatik + elle kalemler, yemek kartı hariç. */
export interface LedgerYear {
  year: number;
  incomeRows: LedgerRow[];
  /** Sırayla: plan, kategori, plan dışı bağış, elle gider kalemleri. */
  expenseRows: LedgerRow[];
  totals: LedgerTotals;
}

/** Hücre; amount null ise "girilmemiş". */
export interface LedgerMonthlyAmount {
  ledgerItemId: number;
  year: number;
  /** 1–12 */
  month: number;
  amount: number | null;
}

/** Hücre yazma; amount null hücreyi temizler. Pasif kalemlerde de çalışır. */
export interface SetMonthlyAmountVariables {
  itemId: number;
  year: number;
  /** 1–12 */
  month: number;
  amount: number | null;
}
