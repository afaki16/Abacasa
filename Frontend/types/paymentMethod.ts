export enum PaymentMethodType {
  Cash = 1,
  BankAccount = 2,
  CreditCard = 3,
  MealCard = 4
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
