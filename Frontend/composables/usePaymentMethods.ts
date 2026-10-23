import type { PaymentMethod, CreatePaymentMethodRequest, UpdatePaymentMethodRequest } from '~/types'
import { PaymentMethodType } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const usePaymentMethods = () => {
  const api = useApi()
  const { t } = useI18n()

  // Tür etiketleri (i18n)
  const typeLabelKeys: Record<PaymentMethodType, string> = {
    [PaymentMethodType.Cash]: 'paymentMethodTypes.cash',
    [PaymentMethodType.BankAccount]: 'paymentMethodTypes.bankAccount',
    [PaymentMethodType.CreditCard]: 'paymentMethodTypes.creditCard',
    [PaymentMethodType.MealCard]: 'paymentMethodTypes.mealCard',
  }

  const getTypeLabel = (type: PaymentMethodType) => (typeLabelKeys[type] ? t(typeLabelKeys[type]) : String(type))

  const typeOptions = computed(() =>
    (Object.keys(typeLabelKeys) as unknown as PaymentMethodType[]).map((key) => ({
      value: Number(key) as PaymentMethodType,
      title: getTypeLabel(Number(key) as PaymentMethodType),
    }))
  )

  const getPaymentMethods = async (page = 1, pageSize = 1000, searchTerm = '') => {
    try {
      const endpoint = getPaginatedEndpoint(API_ENDPOINTS.PAYMENT_METHODS.LIST, page, pageSize, searchTerm)
      const response = await api.get<{
        items: PaymentMethod[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get payment methods error:', error)
      throw error
    }
  }

  const getPaymentMethodById = async (id: string) => {
    try {
      const response = await api.get<PaymentMethod>(API_ENDPOINTS.PAYMENT_METHODS.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get payment method error:', error)
      throw error
    }
  }

  const createPaymentMethod = async (data: CreatePaymentMethodRequest) => {
    try {
      const response = await api.post<PaymentMethod>(API_ENDPOINTS.PAYMENT_METHODS.CREATE, data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create payment method error:', error)
      throw error
    }
  }

  const updatePaymentMethod = async (id: string, data: UpdatePaymentMethodRequest) => {
    try {
      const response = await api.put<PaymentMethod>(API_ENDPOINTS.PAYMENT_METHODS.UPDATE(id), data)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update payment method error:', error)
      throw error
    }
  }

  const deletePaymentMethod = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.PAYMENT_METHODS.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete payment method error:', error)
      throw error
    }
  }

  return {
    getTypeLabel,
    typeOptions,
    getPaymentMethods,
    getPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
  }
}
