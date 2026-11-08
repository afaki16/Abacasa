// Backend: Abacasa.Application/Features/DonationTargets/Dtos (DonationTargetDto, Create/UpdateDonationTargetDto,
// DonationTargetReportDto).

import type { DonationKind } from '@/lib/domain/enums';

export interface DonationTarget {
  id: number;
  /** Boşsa hedef hanenindir. */
  ownerPersonId: number | null;
  ownerName: string | null;
  year: number;
  kind: DonationKind;
  amount: number;
  note: string | null;
  createdDate: string;
}

export interface CreateDonationTargetRequest {
  ownerPersonId?: number | null;
  year: number;
  kind: DonationKind;
  amount: number;
  note?: string | null;
}

export interface UpdateDonationTargetRequest extends CreateDonationTargetRequest {
  id: number;
}

export interface DonationTargetRow {
  targetId: number;
  ownerPersonId: number | null;
  ownerName: string | null;
  kind: DonationKind;
  target: number;
  given: number;
  /** Aktif bağış planlarının bugünden yıl sonuna kadar ödenmemiş vadeleri. */
  planned: number;
  expectedYearEnd: number;
  /** Eksi ise fazla ödendi. */
  remaining: number;
  remainingAfterPlan: number;
}

export interface DonationTargetKindTotal {
  kind: DonationKind;
  target: number;
  given: number;
  /** Yalnızca pozitif kalanların toplamı. */
  remainingTotal: number;
  remainingAfterPlanTotal: number;
}

/** Hedefi olmayan (kişi, tür) çiftlerinin bağışları. */
export interface DonationVoluntary {
  personId: number | null;
  name: string | null;
  kind: DonationKind;
  given: number;
}

/** GET /api/DonationTargets/year/{year}. Emanetten dağıtılan bağışlar verilene ve gönüllüye girmez. */
export interface DonationTargetReport {
  year: number;
  rows: DonationTargetRow[];
  totalsByKind: DonationTargetKindTotal[];
  voluntary: DonationVoluntary[];
}
