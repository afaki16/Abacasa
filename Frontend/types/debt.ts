// Backend Currency ile aynı; TRY dışındakiler yabancı (TL karşılığı kurla). QuarterGold çeyrek altın adedi (tam sayı)
export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
  QuarterGold = 'QuarterGold'
}

/** Bir birimin güncel kuru: TCMB ile hanenin elle kurundan tarihi yeni olan (eşitse elle) */
export interface CurrentRate {
  currency: Currency
  rate: number
  date: string
  source: 'TCMB' | 'Elle'
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
  /** Yabancı birimde kur yoksa null */
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
  /** Yalnızca açığı > 0 olan yabancı birimler */
  foreign: {
    currency: Currency
    open: number
    rate: { rate: number; date: string; source: 'TCMB' | 'Elle' } | null
    /** Kur yoksa null */
    openInTry: number | null
  }[]
  /** Açığı olan bir birimin kuru yoksa null */
  openTotalInTry: number | null
  paidTotalInTry: number
  openCount: number
  /** USD, EUR ve çeyrek altının güncel kurları (kuru olmayan yok) */
  rates: CurrentRate[]
  byCreditor: {
    personId: number
    name: string
    openTry: number
    foreign: { currency: Currency; open: number; openInTry: number | null }[]
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
  /** Yalnızca yabancı birimde (döviz kuru ya da çeyrek fiyatı) */
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
