// Vehicles uçları (VehiclesController). Yetkiler: Vehicles.Read / Create / Update / Delete;
// işlemler (obligations) Vehicles.Update.

import { apiGet, apiPost, apiPut, apiSend, DEFAULT_PAGE_SIZE, type PagedResult } from '@/lib/api';
import { todayIso } from '@/lib/format/period';

import type {
  CreateVehicleRequest,
  SaveVehicleObligationRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleListParams,
  VehicleObligation,
  VehicleReminder,
} from './types';

export const VEHICLES_ENDPOINTS = {
  LIST: '/api/Vehicles',
  UPCOMING: '/api/Vehicles/upcoming',
  DETAIL: (id: number) => `/api/Vehicles/${id}`,
  OBLIGATIONS: (vehicleId: number) => `/api/Vehicles/${vehicleId}/obligations`,
  OBLIGATION: (vehicleId: number, obligationId: number) => `/api/Vehicles/${vehicleId}/obligations/${obligationId}`,
} as const;

export const vehiclesApi = {
  list(page: number, { searchTerm, isActive }: VehicleListParams = {}): Promise<PagedResult<Vehicle>> {
    return apiGet<PagedResult<Vehicle>>(VEHICLES_ENDPOINTS.LIST, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      searchTerm: searchTerm?.trim() || undefined,
      isActive,
    });
  },

  /** Hatırlatmalar (sayfasız dizi); today cihazın bugünü. */
  upcoming(today: string = todayIso()): Promise<VehicleReminder[]> {
    return apiGet<VehicleReminder[]>(VEHICLES_ENDPOINTS.UPCOMING, { today });
  },

  get(id: number): Promise<Vehicle> {
    return apiGet<Vehicle>(VEHICLES_ENDPOINTS.DETAIL(id));
  },

  create(request: CreateVehicleRequest): Promise<Vehicle> {
    return apiPost<Vehicle>(VEHICLES_ENDPOINTS.LIST, request);
  },

  update(request: UpdateVehicleRequest): Promise<Vehicle> {
    return apiPut<Vehicle>(VEHICLES_ENDPOINTS.DETAIL(request.id), request);
  },

  /** Kaydı olan araç silinemez (409); pasif yapılır. */
  remove(id: number): Promise<string | undefined> {
    return apiSend('delete', VEHICLES_ENDPOINTS.DETAIL(id));
  },

  /** Aracın işlemleri, geçerlilik sonu en yeni önce (sayfasız dizi). */
  obligations(vehicleId: number): Promise<VehicleObligation[]> {
    return apiGet<VehicleObligation[]>(VEHICLES_ENDPOINTS.OBLIGATIONS(vehicleId));
  },

  /** createExpense ile aynı kayıtta bağlı harcama da oluşturulur. */
  createObligation(vehicleId: number, request: SaveVehicleObligationRequest): Promise<VehicleObligation> {
    return apiPost<VehicleObligation>(VEHICLES_ENDPOINTS.OBLIGATIONS(vehicleId), request);
  },

  /** Bağlı canlı harcama tarih ve tutarı izler. */
  updateObligation(vehicleId: number, obligationId: number, request: SaveVehicleObligationRequest): Promise<VehicleObligation> {
    return apiPut<VehicleObligation>(VEHICLES_ENDPOINTS.OBLIGATION(vehicleId, obligationId), request);
  },

  /** Bağlı canlı harcama da silinir. */
  removeObligation(vehicleId: number, obligationId: number): Promise<string | undefined> {
    return apiSend('delete', VEHICLES_ENDPOINTS.OBLIGATION(vehicleId, obligationId));
  },
};
