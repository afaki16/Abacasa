export enum Currency {
  TRY = 1,
  USD = 2
}

export interface Debt {
  id: number
  creditorPersonId: number
  creditorName: string
  /** Boşsa borçlu hanedir */
  debtorPersonId?: number | null
  debtorName?: string | null
  currency: Currency
  /** Borcun kendi para biriminde */
  amount: number
  /** 'YYYY-MM-DD' */
  date: string
  note?: string | null
  // Hesaplanan alanlar (saklanmaz)
  paidAmount: number
  remaining: number
  isClosed: boolean
  paidInTry: number
  /** USD'de kur yoksa null */
  remainingInTry: number | null
  paymentCount: number
  /** Ödemesi varsa para birimi değiştirilemez */
  hasPayments: boolean
  createdDate: string
}

export interface CreateDebtRequest {
  creditorPersonId: number
  debtorPersonId?: number
  currency: Currency
  amount: number
  date: string
  note?: string
}

export interface UpdateDebtRequest extends CreateDebtRequest {
  id: number
}

export interface DebtFilters {
  isClosed?: boolean
  creditorPersonId?: number
  currency?: Currency
}

export interface DebtSummary {
  openTry: number
  openUsd: number
  /** Kur girilmemişse null */
  usdRate: { rate: number; date: string } | null
  openUsdInTry: number | null
  openTotalInTry: number | null
  paidTotalInTry: number
  openCount: number
  byCreditor: {
    personId: number
    name: string
    openTry: number
    openUsd: number
    openUsdInTry: number | null
    totalInTry: number | null
  }[]
}

export interface DebtPayment {
  id: number
  debtId: number
  date: string
  /** Borcun para biriminde */
  amount: number
  exchangeRate?: number | null
  amountInTry: number
  note?: string | null
  createdDate: string
}

export interface SaveDebtPaymentRequest {
  date: string
  amount: number
  /** Yalnızca USD borçta */
  exchangeRate?: number
  note?: string
}

export interface ExchangeRate {
  id: number
  currency: Currency
  rate: number
  date: string
  createdDate: string
}

export interface SaveExchangeRateRequest {
  currency: Currency
  rate: number
  date: string
}
