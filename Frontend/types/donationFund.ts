import type { DonationKind } from './donation'

export enum FundMovementType {
  Use = 1,
  Return = 2
}

export interface DonationFund {
  id: number
  fromPersonId: number
  fromPersonName: string
  kind: DonationKind
  amount: number
  /** 'YYYY-MM-DD' */
  date: string
  note?: string | null
  // Hesaplanan alanlar (saklanmaz)
  distributed: number
  /** Kullanımlar − yerine koymalar */
  inUse: number
  /** Dağıtılacak kalan = tutar − dağıtılan */
  remaining: number
  /** Kalan − kullanımda */
  onHand: number
  isClosed: boolean
  distributionCount: number
  movementCount: number
  createdDate: string
}

export interface CreateDonationFundRequest {
  fromPersonId: number
  kind: DonationKind
  amount: number
  date: string
  note?: string
}

export interface UpdateDonationFundRequest extends CreateDonationFundRequest {
  id: number
}

export interface DonationFundFilters {
  isClosed?: boolean
}

export interface FundMovement {
  id: number
  fundId: number
  type: FundMovementType
  date: string
  amount: number
  note?: string | null
  createdDate: string
}

export interface SaveFundMovementRequest {
  type: FundMovementType
  date: string
  amount: number
  note?: string
}
