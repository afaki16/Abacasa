import type { PaymentMethodType } from './paymentMethod'

export enum DonationKind {
  Donation = 1,
  Zakat = 2,
  Scholarship = 3
}

export interface Donation {
  id: number
  /** 'YYYY-MM-DD' */
  date: string
  amount: number
  kind: DonationKind
  recipient: string
  /** Boşsa bağışı hane vermiştir */
  giverPersonId?: number
  giverPersonName?: string
  paymentMethodId: number
  paymentMethodName: string
  paymentMethodType: PaymentMethodType
  note?: string
  /** Emanetten dağıtıldıysa; böyle bağış hiçbir toplama ve hedefe girmez */
  fundId?: number | null
  /** "Kimden · Tür" */
  fundLabel?: string | null
  createdDate: string
}

export interface CreateDonationRequest {
  date: string
  amount: number
  kind: DonationKind
  recipient: string
  giverPersonId?: number
  paymentMethodId: number
  note?: string
  fundId?: number
}

export interface UpdateDonationRequest extends CreateDonationRequest {
  id: number
}

export interface DonationFilters {
  startDate?: string
  endDate?: string
  kind?: DonationKind
  fundId?: number
}

export interface DonationSummary {
  total: number
  count: number
  /** Emanetten dağıtılanlar; total ve count'a girmez */
  fundDistributedTotal: number
  fundDistributedCount: number
  byKind: { kind: DonationKind; total: number; count: number }[]
  /** personId/personName null ise bağışı hane vermiştir */
  byGiver: { personId: number | null; personName: string | null; total: number; count: number }[]
}
