import type {
  Debt,
  CreateDebtRequest,
  UpdateDebtRequest,
  DebtFilters,
  DebtSummary,
  DebtPayment,
  SaveDebtPaymentRequest,
  ExchangeRate,
  SaveExchangeRateRequest
} from '~/types'
import { Currency } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

// Boş olmayan filtreleri query string'e ekler
const appendFilters = (endpoint: string, filters: Record<string, unknown> = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  })
  const query = params.toString()
  if (!query) return endpoint
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`
}

export const useDebts = () => {
  const api = useApi()

  const currencyOptions = [
    { value: Currency.TRY, title: 'TL' },
    { value: Currency.USD, title: 'USD' },
  ]

  // useMoney().formatMoney için para birimi kodu
  const currencyCode = (currency: Currency): 'TRY' | 'USD' => (currency === Currency.USD ? 'USD' : 'TRY')

  const getDebts = async (page = 1, pageSize = 10, searchTerm = '', filters: DebtFilters = {}) => {
    try {
      const endpoint = appendFilters(
        getPaginatedEndpoint(API_ENDPOINTS.DEBTS.LIST, page, pageSize, searchTerm),
        { ...filters }
      )
      const response = await api.get<{
        items: Debt[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get debts error:', error)
      throw error
    }
  }

  const getDebtSummary = async () => {
    try {
      const response = await api.get<DebtSummary>(API_ENDPOINTS.DEBTS.SUMMARY)
      return response.data
    } catch (error) {
      console.error('Get debt summary error:', error)
      throw error
    }
  }

  const getDebtById = async (id: string) => {
    try {
      const response = await api.get<Debt>(API_ENDPOINTS.DEBTS.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get debt error:', error)
      throw error
    }
  }

  const createDebt = async (data: CreateDebtRequest) => {
    try {
      const response = await api.post<Debt>(API_ENDPOINTS.DEBTS.CREATE, data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create debt error:', error)
      throw error
    }
  }

  const updateDebt = async (id: string, data: UpdateDebtRequest) => {
    try {
      const response = await api.put<Debt>(API_ENDPOINTS.DEBTS.UPDATE(id), data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update debt error:', error)
      throw error
    }
  }

  const deleteDebt = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.DEBTS.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete debt error:', error)
      throw error
    }
  }

  const getDebtPayments = async (debtId: number) => {
    try {
      const response = await api.get<DebtPayment[]>(API_ENDPOINTS.DEBTS.PAYMENTS(String(debtId)))
      return response.data
    } catch (error) {
      console.error('Get debt payments error:', error)
      throw error
    }
  }

  const createDebtPayment = async (debtId: number, data: SaveDebtPaymentRequest) => {
    try {
      const response = await api.post<DebtPayment>(API_ENDPOINTS.DEBTS.PAYMENTS(String(debtId)), data)
      return response.data
    } catch (error) {
      console.error('Create debt payment error:', error)
      throw error
    }
  }

  const updateDebtPayment = async (debtId: number, paymentId: number, data: SaveDebtPaymentRequest) => {
    try {
      const response = await api.put<DebtPayment>(API_ENDPOINTS.DEBTS.PAYMENT(String(debtId), String(paymentId)), data)
      return response.data
    } catch (error) {
      console.error('Update debt payment error:', error)
      throw error
    }
  }

  const deleteDebtPayment = async (debtId: number, paymentId: number) => {
    try {
      await api.delete(API_ENDPOINTS.DEBTS.PAYMENT(String(debtId), String(paymentId)))
      return true
    } catch (error) {
      console.error('Delete debt payment error:', error)
      throw error
    }
  }

  const getExchangeRates = async (currency: Currency = Currency.USD) => {
    try {
      const response = await api.get<ExchangeRate[]>(appendFilters(API_ENDPOINTS.EXCHANGE_RATES.LIST, { currency }))
      return response.data
    } catch (error) {
      console.error('Get exchange rates error:', error)
      throw error
    }
  }

  // Aynı gün için kayıt varsa backend onu günceller
  const saveExchangeRate = async (data: SaveExchangeRateRequest) => {
    try {
      const response = await api.post<ExchangeRate>(API_ENDPOINTS.EXCHANGE_RATES.SAVE, data)
      return response.data
    } catch (error) {
      console.error('Save exchange rate error:', error)
      throw error
    }
  }

  const deleteExchangeRate = async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.EXCHANGE_RATES.DELETE(String(id)))
      return true
    } catch (error) {
      console.error('Delete exchange rate error:', error)
      throw error
    }
  }

  return {
    currencyOptions,
    currencyCode,
    getDebts,
    getDebtSummary,
    getDebtById,
    createDebt,
    updateDebt,
    deleteDebt,
    getDebtPayments,
    createDebtPayment,
    updateDebtPayment,
    deleteDebtPayment,
    getExchangeRates,
    saveExchangeRate,
    deleteExchangeRate
  }
}
