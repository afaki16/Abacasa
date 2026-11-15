// Backend: Abacasa.Application/Features/Donations/Dtos (DonationListDto, DonationDto, Create/UpdateDonationDto,
// DonationSummaryDto).

import type { Currency, DonationKind, PaymentMethodType } from '@/lib/domain/enums';
import type { Period } from '@/lib/format/period';

/** GET /api/Donations (liste öğesi). Bağışlar harcama özetine girmez. */
export interface DonationListItem {
  id: number;
  /** 'YYYY-MM-DD' */
  date: string;
  /** Her zaman TL (dövizde foreignAmount × exchangeRate). */
  amount: number;
  currency: Currency;
  /** TRY dışında: birim cinsinden tutar (çeyrekte adet) ve bağış günündeki kur. */
  foreignAmount: number | null;
  exchangeRate: number | null;
  kind: DonationKind;
  recipient: string;
  /** Boşsa bağışı hane vermiştir. */
  giverPersonId: number | null;
  giverPersonName: string | null;
  paymentMethodId: number;
  paymentMethodName: string;
  paymentMethodType: PaymentMethodType;
  note: string | null;
  /** Emanetten dağıtıldıysa; böyle bağış hiçbir toplama ve hedefe girmez. */
  fundId: number | null;
  /** "Kimden · Tür" */
  fundLabel: string | null;
  createdDate: string;
}

/** GET /api/Donations/{id}: liste alanları + denetim alanları (listeden placeholder için opsiyonel). */
export interface DonationDetail extends DonationListItem {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

/** Liste ve özet filtreleri. period verilirse startDate/endDate olarak gönderilir. */
export interface DonationListParams {
  searchTerm?: string;
  period?: Pick<Period, 'start' | 'end'>;
  kind?: DonationKind;
  /** Bir emanetten dağıtılan bağışlar. */
  fundId?: number;
}

export interface CreateDonationRequest {
  date: string;
  /** TL bağışta zorunlu; dövizde backend foreignAmount × exchangeRate ile hesaplar. */
  amount: number;
  /** Verilmezse TRY. */
  currency?: Currency;
  foreignAmount?: number | null;
  exchangeRate?: number | null;
  /** Emanetten dağıtımda emanetle aynı tür olmalı. */
  kind: DonationKind;
  recipient: string;
  giverPersonId?: number | null;
  paymentMethodId: number;
  note?: string | null;
  fundId?: number | null;
}

export interface UpdateDonationRequest extends CreateDonationRequest {
  id: number;
}

/** GET /api/Donations/summary */
export interface DonationSummary {
  total: number;
  count: number;
  /** Emanetten dağıtılanlar; total ve count'a girmez. */
  fundDistributedTotal: number;
  fundDistributedCount: number;
  byKind: { kind: DonationKind; total: number; count: number }[];
  /** personId/personName null ise bağışı hane vermiştir. */
  byGiver: { personId: number | null; personName: string | null; total: number; count: number }[];
}
