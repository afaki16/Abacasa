import type { PaymentMethodType } from './paymentMethod'
import type { DonationKind } from './donation'

export enum RecurringPaymentKind {
  Subscription = 1,
  Bill = 2,
  Installment = 3,
  Donation = 4
}

export interface RecurringPayment {
  id: number
  name: string
  kind: RecurringPaymentKind
  expectedAmount?: number | null
  dueDay: number
  /** 'YYYY-MM-01' */
  startMonth: string
  isActive: boolean
  paymentMethodId: number
  paymentMethodName: string
  categoryId?: number | null
  categoryName?: string | null
  /** Bağışta veren kişi; boşsa hane */
  ownerPersonId?: number | null
  ownerPersonName?: string | null
  recipient?: string | null
  donationKind?: DonationKind | null
  totalAmount?: number | null
  installmentCount?: number | null
  /** 'YYYY-MM-DD' */
  firstDueDate?: string | null
  /** Ödemesi varsa tür, taksit sayısı ve ilk taksit tarihi değiştirilemez */
  hasPayments: boolean
  createdDate: string
}

export interface CreateRecurringPaymentRequest {
  name: string
  kind: RecurringPaymentKind
  expectedAmount?: number | null
  dueDay?: number | null
  startMonth?: string | null
  paymentMethodId: number
  categoryId?: number | null
  ownerPersonId?: number | null
  recipient?: string | null
  donationKind?: DonationKind | null
  totalAmount?: number | null
  installmentCount?: number | null
  firstDueDate?: string | null
}

export interface UpdateRecurringPaymentRequest extends CreateRecurringPaymentRequest {
  id: number
  isActive: boolean
}

export interface RecurringPaymentFilters {
  kind?: RecurringPaymentKind
  isActive?: boolean
}

export interface RecurringPaymentOccurrence {
  recurringPaymentId: number
  name: string
  kind: RecurringPaymentKind
  /** Ayın 1'i */
  month: string
  dueDate: string
  installmentNo?: number | null
  installmentCount?: number | null
  /** Ödenmişse kaydın gerçek aracı, bekliyorsa planın aracı */
  paymentMethodId: number
  paymentMethodName: string
  categoryName?: string | null
  personName?: string | null
  recipient?: string | null
  isPaid: boolean
  paidAmount?: number | null
  paidDate?: string | null
  expenseId?: number | null
  donationId?: number | null
  /** null: tutar belli değil */
  amount?: number | null
  isEstimated: boolean
}

export interface RecurringPaymentOccurrences {
  items: RecurringPaymentOccurrence[]
  paidTotal: number
  /** Tahmini tutarlar dahil, tutarı belli olmayanlar hariç */
  pendingTotal: number
  total: number
  unknownCount: number
  byPaymentMethod: {
    id: number
    name: string
    type: PaymentMethodType
    paidTotal: number
    pendingTotal: number
    total: number
  }[]
}

export interface PayRecurringPaymentRequest {
  /** 'YYYY-MM-01' */
  month: string
  amount?: number
  date: string
}

export interface PayRecurringPaymentResult {
  type: 'expense' | 'donation'
  id: number
}
