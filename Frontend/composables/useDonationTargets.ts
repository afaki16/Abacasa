import type { DonationTarget, CreateDonationTargetRequest, UpdateDonationTargetRequest, DonationTargetReport } from '~/types'
import { API_ENDPOINTS } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const useDonationTargets = () => {
  const api = useApi()

  // today istemcinin bugünü; planlanan tutar bugünden yıl sonuna kadar hesaplanır
  const getTargetReport = async (year: number, today: string) => {
    try {
      const response = await api.get<DonationTargetReport>(`${API_ENDPOINTS.DONATION_TARGETS.REPORT(year)}?today=${today}`)
      return response.data
    } catch (error) {
      console.error('Get donation target report error:', error)
      throw error
    }
  }

  const getTargets = async (year: number) => {
    try {
      const response = await api.get<{ items: DonationTarget[]; totalCount: number; totalPages: number; pageNumber: number }>(
        `${API_ENDPOINTS.DONATION_TARGETS.LIST}?year=${year}&pageSize=1000`)
      return response.data?.items ?? []
    } catch (error) {
      console.error('Get donation targets error:', error)
      throw error
    }
  }

  const createTarget = async (data: CreateDonationTargetRequest) => {
    try {
      const response = await api.post<DonationTarget>(API_ENDPOINTS.DONATION_TARGETS.CREATE, data)
      return response.data
    } catch (error) {
      console.error('Create donation target error:', error)
      throw error
    }
  }

  const updateTarget = async (id: number, data: UpdateDonationTargetRequest) => {
    try {
      const response = await api.put<DonationTarget>(API_ENDPOINTS.DONATION_TARGETS.UPDATE(String(id)), data)
      return response.data
    } catch (error) {
      console.error('Update donation target error:', error)
      throw error
    }
  }

  const deleteTarget = async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.DONATION_TARGETS.DELETE(String(id)))
      return true
    } catch (error) {
      console.error('Delete donation target error:', error)
      throw error
    }
  }

  return { getTargetReport, getTargets, createTarget, updateTarget, deleteTarget }
}
