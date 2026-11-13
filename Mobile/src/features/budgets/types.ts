// Backend: Abacasa.Application/Features/Budgets/Dtos (BudgetDto, Create/UpdateBudgetDto, BudgetReportDto).

/** Aylık harcama bütçesi: başlangıç ayından itibaren, aynı kişinin daha yeni kaydına kadar geçerli. 0 = o aydan itibaren bütçe yok. */
export interface Budget {
  id: number;
  /** Boşsa hanenin bütçesidir. */
  ownerPersonId: number | null;
  ownerName: string | null;
  startYear: number;
  startMonth: number;
  amount: number;
  note: string | null;
  createdDate: string;
}

export interface CreateBudgetRequest {
  ownerPersonId?: number | null;
  startYear: number;
  startMonth: number;
  amount: number;
  note?: string | null;
}

export interface UpdateBudgetRequest extends CreateBudgetRequest {
  id: number;
}

export interface BudgetRow {
  /** Ortak satırında boş. */
  budgetId: number | null;
  /** Boşsa hane ya da Ortak. */
  personId: number | null;
  name: string | null;
  /** Hane bütçesinden kişi bütçeleri çıkınca kalan; kişisiz kayıtlar ve bütçesi olmayan kişiler. */
  isShared: boolean;
  budget: number;
  spent: number;
  /** Ödenmemiş sabit ödeme vadeleri (bütçeden ayrılır). */
  pending: number;
  used: number;
  /** Eksi ise aşıldı. */
  remaining: number;
  /** Kalan gün yoksa boş. */
  dailyAllowance: number | null;
  usedPercent: number;
}

/**
 * GET /api/Budgets/month/{year}/{month}. Kullanılan = ayın harcamaları + ödenmemiş sabit ödemeler;
 * yemek kartı, bağışlar ve bağış planları hariç. Kalan devretmez.
 */
export interface BudgetReport {
  year: number;
  month: number;
  daysInMonth: number;
  /** Bugün dahil; geçmiş ayda 0. */
  daysLeft: number;
  household: BudgetRow | null;
  rows: BudgetRow[];
  personBudgetsExceedHousehold: boolean;
  pendingUnknownCount: number;
  suggestion: {
    income: number | null;
    incomeIsAverage: boolean;
    fixedPayments: number;
    variableRoom: number | null;
  };
}
