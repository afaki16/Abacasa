export enum VehicleObligationType {
  TrafficInsurance = 1,
  Kasko = 2,
  Inspection = 3,
  Mtv = 4
}

export interface Vehicle {
  id: number
  name: string
  /** Büyük harfle saklanır */
  plate: string
  /** Boşsa araç hanenindir */
  ownerPersonId?: number | null
  ownerName?: string | null
  isActive: boolean
  note?: string | null
  /** Her tür için güncel kayıt */
  current: { type: VehicleObligationType; validUntil: string; lastAmount: number | null }[]
  createdDate: string
}

export interface CreateVehicleRequest {
  name: string
  plate: string
  ownerPersonId?: number
  note?: string
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
  id: number
  isActive: boolean
}

export interface VehicleObligation {
  id: number
  vehicleId: number
  type: VehicleObligationType
  /** 'YYYY-MM-DD' */
  date: string
  validUntil: string
  amount?: number | null
  note?: string | null
  expenseId?: number | null
  /** Bağlı harcama canlı mı */
  hasExpense: boolean
  createdDate: string
}

export interface SaveVehicleObligationRequest {
  type: VehicleObligationType
  date: string
  validUntil: string
  amount?: number
  note?: string
  /** "Harcama olarak da kaydet"; bağlı harcama varsa yok sayılır */
  createExpense: boolean
  categoryId?: number
  paymentMethodId?: number
}

/** Aktif aracın güncel kaydı; geçerlilik sonu bugünden 30 gün içinde ya da geçmiş */
export interface VehicleReminder {
  vehicleId: number
  vehicleName: string
  plate: string
  type: VehicleObligationType
  validUntil: string
  lastAmount: number | null
  /** Eksi ise gecikmiş gün sayısı */
  daysLeft: number
  isOverdue: boolean
}
