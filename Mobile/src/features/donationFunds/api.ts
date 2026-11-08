// DonationFunds uçları (DonationFundsController). Yetkiler: DonationFunds.Read / Create / Update / Delete;
// hareketler (kullanım / yerine koyma) DonationFunds.Update. Dağıtımlar bağış kaydıdır (fundId):
// donations modülünde useFundDistributions.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';

import type {
  CreateDonationFundRequest,
  DonationFund,
  DonationFundListParams,
  FundMovement,
  SaveFundMovementRequest,
  UpdateDonationFundRequest,
} from './types';

export const DONATION_FUNDS_ENDPOINTS = {
  LIST: '/api/DonationFunds',
  DETAIL: (id: number) => `/api/DonationFunds/${id}`,
  MOVEMENTS: (fundId: number) => `/api/DonationFunds/${fundId}/movements`,
  MOVEMENT: (fundId: number, movementId: number) => `/api/DonationFunds/${fundId}/movements/${movementId}`,
} as const;

export const donationFundsApi = {
  list(page: number, { searchTerm, isClosed }: DonationFundListParams = {}): Promise<PagedResult<DonationFund>> {
    return apiGet<PagedResult<DonationFund>>(DONATION_FUNDS_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
      isClosed,
    });
  },

  get(id: number): Promise<DonationFund> {
    return apiGet<DonationFund>(DONATION_FUNDS_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateDonationFundRequest): Promise<DonationFund> {
    return apiPost<DonationFund>(DONATION_FUNDS_ENDPOINTS.LIST, request);
  },

  update(request: UpdateDonationFundRequest): Promise<DonationFund> {
    return apiPut<DonationFund>(DONATION_FUNDS_ENDPOINTS.DETAIL(request.id), request);
  },

  /** Dağıtımı ya da hareketi olan emanet silinemez (409). */
  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', DONATION_FUNDS_ENDPOINTS.DETAIL(id));
  },

  /** Emanetin hareketleri (sayfasız dizi). */
  movements(fundId: number): Promise<FundMovement[]> {
    return apiGet<FundMovement[]>(DONATION_FUNDS_ENDPOINTS.MOVEMENTS(fundId));
  },

  createMovement(fundId: number, request: SaveFundMovementRequest): Promise<FundMovement> {
    return apiPost<FundMovement>(DONATION_FUNDS_ENDPOINTS.MOVEMENTS(fundId), request);
  },

  updateMovement(fundId: number, movementId: number, request: SaveFundMovementRequest): Promise<FundMovement> {
    return apiPut<FundMovement>(DONATION_FUNDS_ENDPOINTS.MOVEMENT(fundId, movementId), request);
  },

  removeMovement(fundId: number, movementId: number): Promise<string | undefined> {
    return apiSend('delete', DONATION_FUNDS_ENDPOINTS.MOVEMENT(fundId, movementId));
  },
};
