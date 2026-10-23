import type { Dashboard } from '~/types'
import { API_ENDPOINTS } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const useDashboard = () => {
  const api = useApi()

  // today istemcinin bugünü; sunucu saat dilimine bağımlı olmasın
  const getDashboard = async (startDate: string, endDate: string, today: string) => {
    try {
      const params = new URLSearchParams({ startDate, endDate, today })
      const response = await api.get<Dashboard>(`${API_ENDPOINTS.DASHBOARD.GET}?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Get dashboard error:', error)
      throw error
    }
  }

  return { getDashboard }
}
