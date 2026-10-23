import type { DonationKind } from './donation'

export interface DonationTarget {
  id: number
  /** Boşsa hane */
  ownerPersonId?: number | null
  ownerName?: string | null
  year: number
  kind: DonationKind
  amount: number
  note?: string | null
  createdDate: string
}

export interface CreateDonationTargetRequest {
  ownerPersonId?: number
  year: number
  kind: DonationKind
  amount: number
  note?: string
}

export interface UpdateDonationTargetRequest extends CreateDonationTargetRequest {
  id: number
}

/** Hedef raporu; emanetten dağıtılan bağışlar verilene ve gönüllüye girmez */
export interface DonationTargetReport {
  year: number
  rows: {
    targetId: number
    ownerPersonId: number | null
    ownerName: string | null
    kind: DonationKind
    target: number
    given: number
    /** Aktif bağış planlarının bugünden yıl sonuna kadar ödenmemiş vadeleri */
    planned: number
    expectedYearEnd: number
    /** Eksi ise fazla ödendi */
    remaining: number
    remainingAfterPlan: number
  }[]
  totalsByKind: {
    kind: DonationKind
    target: number
    given: number
    /** Yalnızca pozitif kalanların toplamı */
    remainingTotal: number
    remainingAfterPlanTotal: number
  }[]
  /** Hedefi olmayan (kişi, tür) çiftlerinin bağışları */
  voluntary: { personId: number | null; name: string | null; kind: DonationKind; given: number }[]
}
