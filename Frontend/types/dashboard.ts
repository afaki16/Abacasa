import type { PaymentMethodType } from './paymentMethod'
import type { RecurringPaymentKind } from './recurringPayment'
import type { DebtSummary } from './debt'
import type { VehicleObligationType } from './vehicle'

/** Dönem özeti. Gerçekleşen + bekleyen; yemek kartı ve borç hareketleri dönem toplamına girmez. */
export interface Dashboard {
  /** Yemek kartı hariç gerçekleşen */
  spent: { expenses: number; donations: number; total: number }
  /** Yemek kartı hariç ödenmemiş vadeler; tutarı belli olmayanlar toplama girmez */
  pending: { total: number; count: number; unknownCount: number }
  outflowTotal: number
  mealCard: { spent: number; pending: number; total: number }
  recurring: { paidTotal: number; pendingTotal: number; total: number; unknownCount: number }
  /** Yemek kartı dahil */
  byPaymentMethod: { id: number; name: string; type: PaymentMethodType; spent: number; pending: number; total: number }[]
  /** Yemek kartı hariç; personId null ise hane */
  byPerson: { personId: number | null; name: string | null; spent: number; pending: number; total: number }[]
  /** /api/debts/summary ile aynı */
  debts: DebtSummary
  /**
   * Ödenmemiş sabit ödeme vadeleri (bugünün 60 gün öncesi ile 30 gün sonrası) ve araç hatırlatmaları
   * (geçerlilik sonu bugünden 30 gün içinde ya da geçmiş); vadeye göre sıralı, hiçbir toplama girmez
   */
  upcoming: {
    source: 'recurring' | 'vehicle'
    /** Araç satırında null */
    recurringPaymentId: number | null
    /** Yalnızca araç satırında */
    vehicleId: number | null
    /** Araç satırında "{Araç adı} · {Tür etiketi}" */
    name: string
    /** Yalnızca sabit ödeme satırında */
    kind: RecurringPaymentKind | null
    /** Yalnızca araç satırında */
    obligationType: VehicleObligationType | null
    dueDate: string
    amount: number | null
    isEstimated: boolean
    /** Araç satırında null */
    paymentMethodName: string | null
    isOverdue: boolean
  }[]
}
