import type {
  DonationFund,
  CreateDonationFundRequest,
  UpdateDonationFundRequest,
  DonationFundFilters,
  FundMovement,
  SaveFundMovementRequest
} from '~/types'
import { FundMovementType } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const useDonationFunds = () => {
  const api = useApi()

  const movementTypeOptions = [
    { value: FundMovementType.Use, title: 'Kullanım' },
    { value: FundMovementType.Return, title: 'Yerine koyma' },
  ]

  const getMovementTypeLabel = (type: FundMovementType) =>
    movementTypeOptions.find((o) => o.value === type)?.title ?? String(type)

  const getFunds = async (page = 1, pageSize = 10, searchTerm = '', filters: DonationFundFilters = {}) => {
    try {
      let endpoint = getPaginatedEndpoint(API_ENDPOINTS.DONATION_FUNDS.LIST, page, pageSize, searchTerm)
      if (filters.isClosed !== undefined) endpoint += `${endpoint.includes('?') ? '&' : '?'}isClosed=${filters.isClosed}`
      const response = await api.get<{
        items: DonationFund[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get donation funds error:', error)
      throw error
    }
  }

  const getFundById = async (id: number) => {
    try {
      const response = await api.get<DonationFund>(API_ENDPOINTS.DONATION_FUNDS.GET_BY_ID(String(id)))
      return response.data
    } catch (error) {
      console.error('Get donation fund error:', error)
      throw error
    }
  }

  const createFund = async (data: CreateDonationFundRequest) => {
    try {
      const response = await api.post<DonationFund>(API_ENDPOINTS.DONATION_FUNDS.CREATE, data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create donation fund error:', error)
      throw error
    }
  }

  const updateFund = async (id: string, data: UpdateDonationFundRequest) => {
    try {
      const response = await api.put<DonationFund>(API_ENDPOINTS.DONATION_FUNDS.UPDATE(id), data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update donation fund error:', error)
      throw error
    }
  }

  const deleteFund = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.DONATION_FUNDS.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete donation fund error:', error)
      throw error
    }
  }

  const getMovements = async (fundId: number) => {
    try {
      const response = await api.get<FundMovement[]>(API_ENDPOINTS.DONATION_FUNDS.MOVEMENTS(String(fundId)))
      return response.data
    } catch (error) {
      console.error('Get fund movements error:', error)
      throw error
    }
  }

  const createMovement = async (fundId: number, data: SaveFundMovementRequest) => {
    try {
      const response = await api.post<FundMovement>(API_ENDPOINTS.DONATION_FUNDS.MOVEMENTS(String(fundId)), data)
      return response.data
    } catch (error) {
      console.error('Create fund movement error:', error)
      throw error
    }
  }

  const updateMovement = async (fundId: number, movementId: number, data: SaveFundMovementRequest) => {
    try {
      const response = await api.put<FundMovement>(API_ENDPOINTS.DONATION_FUNDS.MOVEMENT(String(fundId), String(movementId)), data)
      return response.data
    } catch (error) {
      console.error('Update fund movement error:', error)
      throw error
    }
  }

  const deleteMovement = async (fundId: number, movementId: number) => {
    try {
      await api.delete(API_ENDPOINTS.DONATION_FUNDS.MOVEMENT(String(fundId), String(movementId)))
      return true
    } catch (error) {
      console.error('Delete fund movement error:', error)
      throw error
    }
  }

  return {
    movementTypeOptions,
    getMovementTypeLabel,
    getFunds,
    getFundById,
    createFund,
    updateFund,
    deleteFund,
    getMovements,
    createMovement,
    updateMovement,
    deleteMovement
  }
}
