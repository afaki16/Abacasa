// Backend: Abacasa.Application/Features/Expenses/Dtos
// (ExpenseListDto, ExpenseDto, ExpenseSummaryDto, Create/UpdateExpenseDto).

import type { PaymentMethodType } from '@/lib/domain/enums';
import type { Period } from '@/lib/format/period';

/** GET /api/Expenses (liste öğesi); POST/PUT de bunu döner. */
export interface Expense {
  id: number;
  /** 'YYYY-MM-DD' */
  date: string;
  amount: number;
  description: string | null;
  categoryId: number;
  categoryName: string;
  paymentMethodId: number;
  paymentMethodName: string;
  paymentMethodType: PaymentMethodType;
  /** Boşsa harcama hanenindir. */
  ownerPersonId: number | null;
  ownerPersonName: string | null;
  createdDate: string;
}

/** GET /api/Expenses/{id}: liste alanları + denetim alanları. */
export interface ExpenseDetail extends Expense {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

/** Liste ve özet aynı süzgeçleri kullanır. Tarihler dahil (start ≤ date ≤ end). */
export interface ExpenseFilters {
  searchTerm?: string;
  /** Takvim ayı ya da kart dönemi. */
  period?: Period;
  categoryId?: number;
  paymentMethodId?: number;
  ownerPersonId?: number;
}

export interface ExpenseCategoryTotal {
  categoryId: number;
  categoryName: string;
  total: number;
}

export interface ExpensePaymentMethodTotal {
  paymentMethodId: number;
  paymentMethodName: string;
  type: PaymentMethodType;
  total: number;
}

/** GET /api/Expenses/summary */
export interface ExpenseSummary {
  /** Yemek kartı hariç. */
  total: number;
  mealCardTotal: number;
  count: number;
  /** Yemek kartı hariç. */
  byCategory: ExpenseCategoryTotal[];
  /** Yemek kartı dahil. */
  byPaymentMethod: ExpensePaymentMethodTotal[];
}

export interface CreateExpenseRequest {
  /** 'YYYY-MM-DD' */
  date: string;
  amount: number;
  description: string | null;
  categoryId: number;
  paymentMethodId: number;
  /** Boşsa harcama hanenindir. */
  ownerPersonId: number | null;
}

/** id yalnızca route için; gövdede backend yok sayar. */
export interface UpdateExpenseRequest extends CreateExpenseRequest {
  id: number;
}
