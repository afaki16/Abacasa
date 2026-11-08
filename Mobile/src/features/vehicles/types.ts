// Backend: Abacasa.Application/Features/Vehicles/Dtos (VehicleDto, Create/UpdateVehicleDto, VehicleObligationDto,
// SaveVehicleObligationDto, VehicleReminderDto).

import type { VehicleObligationType } from '@/lib/domain/enums';

/** Her tür için aracın güncel kaydı. */
export interface VehicleCurrent {
  type: VehicleObligationType;
  validUntil: string;
  lastAmount: number | null;
}

/** GET /api/Vehicles (liste öğesi) ve GET /api/Vehicles/{id} aynı alanları döner. */
export interface Vehicle {
  id: number;
  name: string;
  /** Büyük harfle saklanır; hanede benzersiz (409). */
  plate: string;
  /** Boşsa araç hanenindir. */
  ownerPersonId: number | null;
  ownerName: string | null;
  isActive: boolean;
  note: string | null;
  current: VehicleCurrent[];
  createdDate: string;
}

export interface VehicleListParams {
  searchTerm?: string;
  isActive?: boolean;
}

export interface CreateVehicleRequest {
  name: string;
  plate: string;
  ownerPersonId?: number | null;
  note?: string | null;
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
  id: number;
  isActive: boolean;
}

/** Araç işlemi (sigorta, kasko, muayene, MTV). */
export interface VehicleObligation {
  id: number;
  vehicleId: number;
  type: VehicleObligationType;
  /** 'YYYY-MM-DD' */
  date: string;
  validUntil: string;
  amount: number | null;
  note: string | null;
  expenseId: number | null;
  /** Bağlı harcama canlı mı; canlıysa tarih/tutar değişikliği ve silme harcamaya yansır. */
  hasExpense: boolean;
  createdDate: string;
}

/** İşlem ekleme ve güncelleme ortak gövdesi. */
export interface SaveVehicleObligationRequest {
  type: VehicleObligationType;
  date: string;
  validUntil: string;
  amount?: number;
  note?: string;
  /** "Harcama olarak da kaydet"; bağlı harcama varsa yok sayılır. */
  createExpense: boolean;
  categoryId?: number;
  paymentMethodId?: number;
}

/** Form değerleri (boş alanlar null); buildObligationRequest ile gövdeye çevrilir. */
export interface VehicleObligationFormValues {
  type: VehicleObligationType;
  date: string;
  validUntil: string;
  amount: number | null;
  note: string | null;
  createExpense: boolean;
  categoryId: number | null;
  paymentMethodId: number | null;
}

export interface CreateVehicleObligationVariables extends SaveVehicleObligationRequest {
  vehicleId: number;
}

export interface UpdateVehicleObligationVariables extends SaveVehicleObligationRequest {
  vehicleId: number;
  obligationId: number;
}

/** Silinen işlemin harcaması varsa (hasExpense) harcama da silinir; önbellek için bildirilir. */
export interface DeleteVehicleObligationVariables {
  vehicleId: number;
  obligationId: number;
  hasExpense: boolean;
}

/** Aktif aracın güncel kaydı; geçerlilik sonu bugünden 30 gün içinde ya da geçmiş. Hiçbir toplama girmez. */
export interface VehicleReminder {
  vehicleId: number;
  vehicleName: string;
  plate: string;
  type: VehicleObligationType;
  validUntil: string;
  lastAmount: number | null;
  /** Eksi ise gecikmiş gün sayısı. */
  daysLeft: number;
  isOverdue: boolean;
}
