// Backend: Abacasa.Application/Features/DonationFunds/Dtos (DonationFundDto, Create/UpdateDonationFundDto,
// FundMovementDto, SaveFundMovementDto).

import type { DonationKind, FundMovementType } from '@/lib/domain/enums';

/** Emanet: başkasının dağıtılmak üzere bıraktığı bağış. Hesaplanan alanlar saklanmaz. */
export interface DonationFund {
  id: number;
  fromPersonId: number;
  fromPersonName: string;
  kind: DonationKind;
  amount: number;
  /** 'YYYY-MM-DD' */
  date: string;
  note: string | null;
  distributed: number;
  /** Kullanımlar − yerine koymalar. */
  inUse: number;
  /** Dağıtılacak kalan = tutar − dağıtılan. */
  remaining: number;
  /** Kalan − kullanımda; sıfırın altına düşemez. */
  onHand: number;
  isClosed: boolean;
  distributionCount: number;
  movementCount: number;
  createdDate: string;
}

export interface DonationFundListParams {
  searchTerm?: string;
  isClosed?: boolean;
}

export interface CreateDonationFundRequest {
  fromPersonId: number;
  kind: DonationKind;
  amount: number;
  date: string;
  note?: string | null;
}

export interface UpdateDonationFundRequest extends CreateDonationFundRequest {
  id: number;
}

export interface FundMovement {
  id: number;
  fundId: number;
  type: FundMovementType;
  date: string;
  amount: number;
  note: string | null;
  createdDate: string;
}

/** Hareket ekleme ve güncelleme ortak gövdesi. */
export interface SaveFundMovementRequest {
  type: FundMovementType;
  date: string;
  amount: number;
  note?: string | null;
}

export interface CreateFundMovementVariables extends SaveFundMovementRequest {
  fundId: number;
}

export interface UpdateFundMovementVariables extends SaveFundMovementRequest {
  fundId: number;
  movementId: number;
}

export interface DeleteFundMovementVariables {
  fundId: number;
  movementId: number;
}
