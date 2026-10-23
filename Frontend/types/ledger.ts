import type { RecurringPaymentKind } from './recurringPayment'

export enum LedgerDirection {
  Income = 1,
  Expense = 2
}

export interface LedgerItem {
  id: number
  name: string
  direction: LedgerDirection
  /** Boşsa kalem hanenindir */
  ownerPersonId?: number | null
  ownerName?: string | null
  isActive: boolean
  /** Tutarı varsa yön değiştirilemez ve kalem silinemez */
  hasAmounts: boolean
  createdDate: string
}

export interface CreateLedgerItemRequest {
  name: string
  direction: LedgerDirection
  ownerPersonId?: number
}

export interface UpdateLedgerItemRequest extends CreateLedgerItemRequest {
  id: number
  isActive: boolean
}

export type LedgerRowSource = 'manual' | 'plan' | 'category' | 'donations'

export interface LedgerRow {
  /** Benzersiz anahtar, ör. "manual-5" */
  key: string
  source: LedgerRowSource
  /** manual: kalem, plan: plan, category: kategori; donations satırında null */
  id: number | null
  name: string
  /** Yalnızca plan satırında */
  kind: RecurringPaymentKind | null
  ownerName: string | null
  /** 12 ay; null "girilmemiş", 0 "0 girilmiş" */
  months: (number | null)[]
  total: number
  monthsWithData: number
  /** Verisi yoksa null */
  average: number | null
}

export interface LedgerYear {
  year: number
  incomeRows: LedgerRow[]
  /** Sırayla: plan, kategori, plan dışı bağış, elle gider kalemleri */
  expenseRows: LedgerRow[]
  totals: {
    incomeByMonth: number[]
    expenseByMonth: number[]
    netByMonth: number[]
    incomeTotal: number
    expenseTotal: number
    netTotal: number
    incomeAverage: number
    expenseAverage: number
    netAverage: number
  }
}
