import type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleObligation,
  SaveVehicleObligationRequest,
  VehicleReminder
} from '~/types'
import { VehicleObligationType } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { daysInMonth } from '~/utils/period'
import { useApi } from './useApi'

export const useVehicles = () => {
  const api = useApi()
  const { t } = useI18n()

  // Tür etiketleri (i18n)
  const typeLabelKeys: Record<VehicleObligationType, string> = {
    [VehicleObligationType.TrafficInsurance]: 'vehicleObligationTypes.trafficInsurance',
    [VehicleObligationType.Kasko]: 'vehicleObligationTypes.kasko',
    [VehicleObligationType.Inspection]: 'vehicleObligationTypes.inspection',
    [VehicleObligationType.Mtv]: 'vehicleObligationTypes.mtv',
  }

  const getTypeLabel = (type: VehicleObligationType) => (typeLabelKeys[type] ? t(typeLabelKeys[type]) : String(type))

  const typeOptions = computed(() =>
    (Object.keys(typeLabelKeys) as unknown as VehicleObligationType[]).map((key) => ({
      value: Number(key) as VehicleObligationType,
      title: getTypeLabel(Number(key) as VehicleObligationType),
    }))
  )

  // Ay sonunu aşan gün (ör. 29 Şubat) ayın son gününe çekilir
  const addYears = (iso: string, years: number) => {
    const [y, m, d] = iso.split('-').map(Number)
    const year = y + years
    const day = Math.min(d, daysInMonth(year, m))
    return `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  /** Geçerlilik sonu önerisi: sigorta/kasko +1 yıl, muayene +2 yıl; MTV Oca–Haz → 31 Temmuz, Tem–Ara → ertesi yıl 31 Ocak */
  const suggestValidUntil = (type: VehicleObligationType, date: string) => {
    if (!date) return ''
    const [y, m] = date.split('-').map(Number)
    switch (type) {
      case VehicleObligationType.Inspection:
        return addYears(date, 2)
      case VehicleObligationType.Mtv:
        return m <= 6 ? `${y}-07-31` : `${y + 1}-01-31`
      default:
        return addYears(date, 1)
    }
  }

  const getVehicles = async (page = 1, pageSize = 10, searchTerm = '') => {
    try {
      const response = await api.get<{
        items: Vehicle[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(getPaginatedEndpoint(API_ENDPOINTS.VEHICLES.LIST, page, pageSize, searchTerm))
      return response
    } catch (error) {
      console.error('Get vehicles error:', error)
      throw error
    }
  }

  // today istemcinin bugünü
  const getUpcoming = async (today: string) => {
    try {
      const response = await api.get<VehicleReminder[]>(`${API_ENDPOINTS.VEHICLES.UPCOMING}?today=${today}`)
      return response.data
    } catch (error) {
      console.error('Get vehicle reminders error:', error)
      throw error
    }
  }

  const createVehicle = async (data: CreateVehicleRequest) => {
    try {
      const response = await api.post<Vehicle>(API_ENDPOINTS.VEHICLES.CREATE, data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create vehicle error:', error)
      throw error
    }
  }

  const updateVehicle = async (id: string, data: UpdateVehicleRequest) => {
    try {
      const response = await api.put<Vehicle>(API_ENDPOINTS.VEHICLES.UPDATE(id), data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update vehicle error:', error)
      throw error
    }
  }

  const deleteVehicle = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.VEHICLES.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete vehicle error:', error)
      throw error
    }
  }

  const getObligations = async (vehicleId: number) => {
    try {
      const response = await api.get<VehicleObligation[]>(API_ENDPOINTS.VEHICLES.OBLIGATIONS(String(vehicleId)))
      return response.data
    } catch (error) {
      console.error('Get vehicle obligations error:', error)
      throw error
    }
  }

  const createObligation = async (vehicleId: number, data: SaveVehicleObligationRequest) => {
    try {
      const response = await api.post<VehicleObligation>(API_ENDPOINTS.VEHICLES.OBLIGATIONS(String(vehicleId)), data)
      return response.data
    } catch (error) {
      console.error('Create vehicle obligation error:', error)
      throw error
    }
  }

  const updateObligation = async (vehicleId: number, obligationId: number, data: SaveVehicleObligationRequest) => {
    try {
      const response = await api.put<VehicleObligation>(API_ENDPOINTS.VEHICLES.OBLIGATION(String(vehicleId), String(obligationId)), data)
      return response.data
    } catch (error) {
      console.error('Update vehicle obligation error:', error)
      throw error
    }
  }

  const deleteObligation = async (vehicleId: number, obligationId: number) => {
    try {
      await api.delete(API_ENDPOINTS.VEHICLES.OBLIGATION(String(vehicleId), String(obligationId)))
      return true
    } catch (error) {
      console.error('Delete vehicle obligation error:', error)
      throw error
    }
  }

  return {
    getTypeLabel,
    typeOptions,
    suggestValidUntil,
    getVehicles,
    getUpcoming,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getObligations,
    createObligation,
    updateObligation,
    deleteObligation
  }
}
