import type { LedgerItem, CreateLedgerItemRequest, UpdateLedgerItemRequest, LedgerYear } from '~/types'
import { LedgerDirection } from '~/types'
import { API_ENDPOINTS } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const useLedger = () => {
  const api = useApi()

  const directionOptions = [
    { value: LedgerDirection.Income, title: 'Gelir' },
    { value: LedgerDirection.Expense, title: 'Gider' },
  ]

  const getLedgerYear = async (year: number) => {
    try {
      const response = await api.get<LedgerYear>(API_ENDPOINTS.LEDGER.YEAR(year))
      return response.data
    } catch (error) {
      console.error('Get ledger year error:', error)
      throw error
    }
  }

  const getLedgerItemById = async (id: number) => {
    try {
      const response = await api.get<LedgerItem>(API_ENDPOINTS.LEDGER.ITEM(String(id)))
      return response.data
    } catch (error) {
      console.error('Get ledger item error:', error)
      throw error
    }
  }

  const createLedgerItem = async (data: CreateLedgerItemRequest) => {
    try {
      const response = await api.post<LedgerItem>(API_ENDPOINTS.LEDGER.ITEMS, data)
      return response.data
    } catch (error) {
      console.error('Create ledger item error:', error)
      throw error
    }
  }

  const updateLedgerItem = async (id: number, data: UpdateLedgerItemRequest) => {
    try {
      const response = await api.put<LedgerItem>(API_ENDPOINTS.LEDGER.ITEM(String(id)), data)
      return response.data
    } catch (error) {
      console.error('Update ledger item error:', error)
      throw error
    }
  }

  const deleteLedgerItem = async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.LEDGER.ITEM(String(id)))
      return true
    } catch (error) {
      console.error('Delete ledger item error:', error)
      throw error
    }
  }

  // Hücre yazma; null hücreyi temizler ("girilmemiş")
  const setMonthlyAmount = async (id: number, year: number, month: number, amount: number | null) => {
    try {
      const response = await api.put(API_ENDPOINTS.LEDGER.AMOUNT(String(id), year, month), { amount })
      return response.data
    } catch (error) {
      console.error('Set monthly amount error:', error)
      throw error
    }
  }

  return {
    directionOptions,
    getLedgerYear,
    getLedgerItemById,
    createLedgerItem,
    updateLedgerItem,
    deleteLedgerItem,
    setMonthlyAmount
  }
}
