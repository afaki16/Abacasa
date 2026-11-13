import type { Budget, BudgetReport, CreateBudgetRequest, UpdateBudgetRequest } from '~/types'
import { API_ENDPOINTS } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const useBudgets = () => {
  const api = useApi()
  const { t, locale } = useI18n()

  // today istemcinin bugünü; kalan gün ve günlük limit buna göre
  const getBudgetReport = async (year: number, month: number, today: string) => {
    try {
      const response = await api.get<BudgetReport>(`${API_ENDPOINTS.BUDGETS.REPORT(year, month)}?today=${today}`)
      return response.data
    } catch (error) {
      console.error('Get budget report error:', error)
      throw error
    }
  }

  const getBudgets = async () => {
    try {
      const response = await api.get<{ items: Budget[]; totalCount: number; totalPages: number; pageNumber: number }>(
        `${API_ENDPOINTS.BUDGETS.LIST}?pageSize=1000`)
      return response.data?.items ?? []
    } catch (error) {
      console.error('Get budgets error:', error)
      throw error
    }
  }

  const createBudget = async (data: CreateBudgetRequest) => {
    try {
      const response = await api.post<Budget>(API_ENDPOINTS.BUDGETS.CREATE, data)
      return response.data
    } catch (error) {
      console.error('Create budget error:', error)
      throw error
    }
  }

  const updateBudget = async (id: number, data: UpdateBudgetRequest) => {
    try {
      const response = await api.put<Budget>(API_ENDPOINTS.BUDGETS.UPDATE(String(id)), data)
      return response.data
    } catch (error) {
      console.error('Update budget error:', error)
      throw error
    }
  }

  const deleteBudget = async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.BUDGETS.DELETE(String(id)))
      return true
    } catch (error) {
      console.error('Delete budget error:', error)
      throw error
    }
  }

  /** "Kasım 2026" */
  const formatMonth = (year: number, month: number) =>
    new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, 1)))

  /** Satır adı: kişi, Ortak ya da Hane */
  const rowName = (row: { name: string | null; isShared?: boolean }) =>
    row.isShared ? t('budgets.shared') : row.name ?? t('budget.household')

  /** %80'e kadar marka rengi, %100'e kadar uyarı, üstü hata */
  const usageColor = (usedPercent: number) => (usedPercent > 100 ? 'error' : usedPercent >= 80 ? 'warning' : 'primary')

  return { getBudgetReport, getBudgets, createBudget, updateBudget, deleteBudget, formatMonth, rowName, usageColor }
}
