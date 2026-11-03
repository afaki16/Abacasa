export enum PaymentMethodType {
  Cash = 'Cash',
  BankAccount = 'BankAccount',
  CreditCard = 'CreditCard',
  MealCard = 'MealCard'
}

export interface PaymentMethod {
  id: number
  name: string
  type: PaymentMethodType
  bank?: string
  /** Boşsa kayıt hanenindir */
  ownerPersonId?: number
  ownerPersonName?: string
  statementDay?: number
  isActive: boolean
  createdDate: string
}

export interface CreatePaymentMethodRequest {
  name: string
  type: PaymentMethodType
  bank?: string
  ownerPersonId?: number
  statementDay?: number
  isActive: boolean
}

export interface UpdatePaymentMethodRequest {
  id: number
  name: string
  type: PaymentMethodType
  bank?: string
  ownerPersonId?: number
  statementDay?: number
  isActive: boolean
}
