// Backend: Abacasa.Application/Features/PaymentMethods/Dtos
// (PaymentMethodListDto, PaymentMethodDto, Create/UpdatePaymentMethodDto).

import type { PaymentMethodType } from '@/lib/domain/enums';

/** GET /api/PaymentMethods (liste öğesi). */
export interface PaymentMethod {
  id: number;
  name: string;
  type: PaymentMethodType;
  bank: string | null;
  /** Boşsa ödeme aracı hanenindir. */
  ownerPersonId: number | null;
  ownerPersonName: string | null;
  /** Yalnızca kredi kartında: hesap kesim günü (1–31). */
  statementDay: number | null;
  /** Pasif araç yeni kayıtta seçilmez; kullanımdaki araç silinmek yerine pasif yapılır. */
  isActive: boolean;
  createdDate: string;
}

/** GET /api/PaymentMethods/{id}: liste alanları + denetim alanları. */
export interface PaymentMethodDetail extends PaymentMethod {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

export interface PaymentMethodListParams {
  searchTerm?: string;
  /** Boşsa hepsi. */
  isActive?: boolean;
}

export interface CreatePaymentMethodRequest {
  name: string;
  type: PaymentMethodType;
  bank: string | null;
  ownerPersonId: number | null;
  statementDay: number | null;
  isActive: boolean;
}

/** id yalnızca route için; gövdede backend yok sayar. */
export interface UpdatePaymentMethodRequest extends CreatePaymentMethodRequest {
  id: number;
}
