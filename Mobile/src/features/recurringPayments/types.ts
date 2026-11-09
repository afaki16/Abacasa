// Backend: Abacasa.Application/Features/RecurringPayments/Dtos
// (RecurringPaymentListDto, RecurringPaymentDto, Create/UpdateRecurringPaymentDto, RecurringPaymentOccurrencesDto,
// PayRecurringPaymentDto, RecurringPaymentPayResultDto).

import type { DonationKind, PaymentMethodType, RecurringPaymentKind } from '@/lib/domain/enums';

/** GET /api/RecurringPayments (liste öğesi). Ödenme durumu saklanmaz; vadelerden hesaplanır. */
export interface RecurringPaymentListItem {
  id: number;
  name: string;
  kind: RecurringPaymentKind;
  expectedAmount: number | null;
  dueDay: number;
  /** 'YYYY-MM-01' */
  startMonth: string;
  isActive: boolean;
  paymentMethodId: number;
  paymentMethodName: string;
  categoryId: number | null;
  categoryName: string | null;
  /** Bağışta veren kişi; boşsa hane. */
  ownerPersonId: number | null;
  ownerPersonName: string | null;
  recipient: string | null;
  donationKind: DonationKind | null;
  totalAmount: number | null;
  installmentCount: number | null;
  /** 'YYYY-MM-DD' */
  firstDueDate: string | null;
  /** Bağlı canlı harcama/bağış varsa tür, taksit sayısı ve ilk taksit tarihi değiştirilemez. */
  hasPayments: boolean;
  createdDate: string;
}

/** GET /api/RecurringPayments/{id}: liste alanları + denetim alanları (listeden placeholder için opsiyonel). */
export interface RecurringPaymentDetail extends RecurringPaymentListItem {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

export interface RecurringPaymentListParams {
  searchTerm?: string;
  kind?: RecurringPaymentKind;
  isActive?: boolean;
}

export interface CreateRecurringPaymentRequest {
  name: string;
  kind: RecurringPaymentKind;
  expectedAmount?: number | null;
  /** Taksitte boş (ilk taksit tarihinden gelir). */
  dueDay?: number | null;
  /** 'YYYY-MM-01'; taksitte boş. */
  startMonth?: string | null;
  paymentMethodId: number;
  categoryId?: number | null;
  ownerPersonId?: number | null;
  recipient?: string | null;
  donationKind?: DonationKind | null;
  totalAmount?: number | null;
  installmentCount?: number | null;
  /** 'YYYY-MM-DD' */
  firstDueDate?: string | null;
}

export interface UpdateRecurringPaymentRequest extends CreateRecurringPaymentRequest {
  id: number;
  isActive: boolean;
}

/** Dönemdeki tek vade (plan + ay). */
export interface RecurringPaymentOccurrence {
  recurringPaymentId: number;
  name: string;
  kind: RecurringPaymentKind;
  /** Ayın 1'i ('YYYY-MM-01'); ödeme isteğinde aynen gönderilir. */
  month: string;
  dueDate: string;
  installmentNo: number | null;
  installmentCount: number | null;
  /** Ödenmişse kaydın gerçek aracı, bekliyorsa planın aracı. */
  paymentMethodId: number;
  paymentMethodName: string;
  categoryName: string | null;
  personName: string | null;
  recipient: string | null;
  isPaid: boolean;
  paidAmount: number | null;
  paidDate: string | null;
  expenseId: number | null;
  donationId: number | null;
  /** null: tutar belli değil. */
  amount: number | null;
  isEstimated: boolean;
}

export interface RecurringPaymentMethodTotal {
  id: number;
  name: string;
  type: PaymentMethodType;
  paidTotal: number;
  pendingTotal: number;
  total: number;
}

/** GET /api/RecurringPayments/occurrences (en fazla 366 gün). */
export interface RecurringPaymentOccurrences {
  items: RecurringPaymentOccurrence[];
  paidTotal: number;
  /** Tahmini tutarlar dahil, tutarı belli olmayanlar hariç. */
  pendingTotal: number;
  total: number;
  unknownCount: number;
  byPaymentMethod: RecurringPaymentMethodTotal[];
}

export interface OccurrenceRange {
  start: string;
  end: string;
}

export interface PayRecurringPaymentRequest {
  /** 'YYYY-MM-01' (vadenin month alanı) */
  month: string;
  amount?: number;
  /** 'YYYY-MM-DD' ödeme tarihi */
  date: string;
  /** Boşsa planın ödeme aracı; doluysa bu ödeme o araçla kaydedilir (plan değişmez). */
  paymentMethodId?: number;
}

/** Ödeme, plan türüne göre harcama ya da bağış kaydı oluşturur. */
export type LinkedRecordType = 'expense' | 'donation';

export interface PayRecurringPaymentResult {
  type: LinkedRecordType;
  id: number;
}

/** Ödeyi mutation değişkeni: plan id + gövde. */
export interface PayRecurringPaymentVariables extends PayRecurringPaymentRequest {
  recurringPaymentId: number;
}

/** Vadeye bağlı canlı kayıt (geri almada silinecek kayıt). */
export interface LinkedRecord {
  type: LinkedRecordType;
  id: number;
}
