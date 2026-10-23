import type {
  RecurringPayment,
  CreateRecurringPaymentRequest,
  UpdateRecurringPaymentRequest,
  RecurringPaymentFilters,
  RecurringPaymentOccurrences,
  PayRecurringPaymentRequest,
  PayRecurringPaymentResult
} from '~/types'
import { RecurringPaymentKind } from '~/types'
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

export const useRecurringPayments = () => {
  const api = useApi()
  const { t } = useI18n()

  // Tür etiketleri (i18n)
  const kindLabelKeys: Record<RecurringPaymentKind, string> = {
    [RecurringPaymentKind.Subscription]: 'recurringPaymentKinds.subscription',
    [RecurringPaymentKind.Bill]: 'recurringPaymentKinds.bill',
    [RecurringPaymentKind.Installment]: 'recurringPaymentKinds.installment',
    [RecurringPaymentKind.Donation]: 'recurringPaymentKinds.donation',
  }

  const getKindLabel = (kind: RecurringPaymentKind) => (kindLabelKeys[kind] ? t(kindLabelKeys[kind]) : String(kind))

  const kindOptions = computed(() =>
    (Object.keys(kindLabelKeys) as unknown as RecurringPaymentKind[]).map((key) => ({
      value: Number(key) as RecurringPaymentKind,
      title: getKindLabel(Number(key) as RecurringPaymentKind),
    }))
  )

  const getRecurringPayments = async (page = 1, pageSize = 10, searchTerm = '', filters: RecurringPaymentFilters = {}) => {
    try {
      const endpoint = appendFilters(
        getPaginatedEndpoint(API_ENDPOINTS.RECURRING_PAYMENTS.LIST, page, pageSize, searchTerm),
        { ...filters }
      )
      const response = await api.get<{
        items: RecurringPayment[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get recurring payments error:', error)
      throw error
    }
  }

  const getOccurrences = async (startDate: string, endDate: string) => {
    try {
      const endpoint = appendFilters(API_ENDPOINTS.RECURRING_PAYMENTS.OCCURRENCES, { startDate, endDate })
      const response = await api.get<RecurringPaymentOccurrences>(endpoint)
      return response.data
    } catch (error) {
      console.error('Get recurring payment occurrences error:', error)
      throw error
    }
  }

  const getRecurringPaymentById = async (id: string) => {
    try {
      const response = await api.get<RecurringPayment>(API_ENDPOINTS.RECURRING_PAYMENTS.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get recurring payment error:', error)
      throw error
    }
  }

  const createRecurringPayment = async (data: CreateRecurringPaymentRequest) => {
    try {
      const response = await api.post<RecurringPayment>(API_ENDPOINTS.RECURRING_PAYMENTS.CREATE, data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create recurring payment error:', error)
      throw error
    }
  }

  const updateRecurringPayment = async (id: string, data: UpdateRecurringPaymentRequest) => {
    try {
      const response = await api.put<RecurringPayment>(API_ENDPOINTS.RECURRING_PAYMENTS.UPDATE(id), data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update recurring payment error:', error)
      throw error
    }
  }

  const deleteRecurringPayment = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.RECURRING_PAYMENTS.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete recurring payment error:', error)
      throw error
    }
  }

  // Vadeyi öder; backend bağlı harcama ya da bağış kaydını oluşturur
  const payRecurringPayment = async (id: number, data: PayRecurringPaymentRequest) => {
    try {
      const response = await api.post<PayRecurringPaymentResult>(API_ENDPOINTS.RECURRING_PAYMENTS.PAY(String(id)), data)
      return response.data
    } catch (error) {
      console.error('Pay recurring payment error:', error)
      throw error
    }
  }

  return {
    getKindLabel,
    kindOptions,
    getRecurringPayments,
    getOccurrences,
    getRecurringPaymentById,
    createRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
    payRecurringPayment
  }
}
