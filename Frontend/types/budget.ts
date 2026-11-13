/** Aylık harcama bütçesi: başlangıç ayından itibaren, aynı kişinin daha yeni kaydına kadar geçerli. 0 = o aydan itibaren bütçe yok */
export interface Budget {
  id: number
  /** Boşsa hane */
  ownerPersonId?: number | null
  ownerName?: string | null
  startYear: number
  startMonth: number
  amount: number
  note?: string | null
  createdDate: string
}

export interface CreateBudgetRequest {
  ownerPersonId?: number
  startYear: number
  startMonth: number
  amount: number
  note?: string
}

export interface UpdateBudgetRequest extends CreateBudgetRequest {
  id: number
}

export interface BudgetRow {
  /** Ortak satırında boş */
  budgetId: number | null
  /** Boşsa hane ya da Ortak */
  personId: number | null
  name: string | null
  /** Hane bütçesinden kişi bütçeleri çıkınca kalan; kişisiz kayıtlar ve bütçesi olmayan kişiler */
  isShared: boolean
  budget: number
  spent: number
  /** Ödenmemiş sabit ödeme vadeleri (bütçeden ayrılır) */
  pending: number
  used: number
  /** Eksi ise aşıldı */
  remaining: number
  /** Kalan gün yoksa boş */
  dailyAllowance: number | null
  usedPercent: number
}

/** Ayın bütçe raporu. Kullanılan = harcamalar + ödenmemiş sabit ödemeler; yemek kartı ve bağışlar hariç */
export interface BudgetReport {
  year: number
  month: number
  daysInMonth: number
  /** Bugün dahil; geçmiş ayda 0 */
  daysLeft: number
  household: BudgetRow | null
  rows: BudgetRow[]
  personBudgetsExceedHousehold: boolean
  pendingUnknownCount: number
  suggestion: {
    income: number | null
    incomeIsAverage: boolean
    fixedPayments: number
    variableRoom: number | null
  }
}
