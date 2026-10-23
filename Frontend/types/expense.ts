import type { PaymentMethodType } from './paymentMethod'

export interface Expense {
  id: number
  /** 'YYYY-MM-DD' */
  date: string
  amount: number
  description?: string
  categoryId: number
  categoryName: string
  paymentMethodId: number
  paymentMethodName: string
  paymentMethodType: PaymentMethodType
  /** Boşsa harcama hanenindir */
  ownerPersonId?: number
  ownerPersonName?: string
  createdDate: string
}

export interface CreateExpenseRequest {
  date: string
  amount: number
  description?: string
  categoryId: number
  paymentMethodId: number
  ownerPersonId?: number
}

export interface UpdateExpenseRequest extends CreateExpenseRequest {
  id: number
}

export interface ExpenseFilters {
  startDate?: string
  endDate?: string
  categoryId?: number
  paymentMethodId?: number
  ownerPersonId?: number
}

export interface ExpenseSummary {
  /** Yemek kartı hariç */
  total: number
  mealCardTotal: number
  count: number
  byCategory: { categoryId: number; categoryName: string; total: number }[]
  byPaymentMethod: { paymentMethodId: number; paymentMethodName: string; type: PaymentMethodType; total: number }[]
}
