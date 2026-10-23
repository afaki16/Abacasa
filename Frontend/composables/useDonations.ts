import type { Donation, CreateDonationRequest, UpdateDonationRequest, DonationFilters, DonationSummary } from '~/types'
import { DonationKind } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

// Boş olmayan filtreleri query string'e ekler
const appendFilters = (endpoint: string, filters: DonationFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  })
  const query = params.toString()
  if (!query) return endpoint
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`
}

export const useDonations = () => {
  const api = useApi()
  const { t } = useI18n()

  // Tür etiketleri (i18n)
  const kindLabelKeys: Record<DonationKind, string> = {
    [DonationKind.Donation]: 'donationKinds.donation',
    [DonationKind.Zakat]: 'donationKinds.zakat',
    [DonationKind.Scholarship]: 'donationKinds.scholarship',
  }

  const getKindLabel = (kind: DonationKind) => (kindLabelKeys[kind] ? t(kindLabelKeys[kind]) : String(kind))

  const kindOptions = computed(() =>
    (Object.keys(kindLabelKeys) as unknown as DonationKind[]).map((key) => ({
      value: Number(key) as DonationKind,
      title: getKindLabel(Number(key) as DonationKind),
    }))
  )

  const getDonations = async (page = 1, pageSize = 10, searchTerm = '', filters: DonationFilters = {}) => {
    try {
      const endpoint = appendFilters(
        getPaginatedEndpoint(API_ENDPOINTS.DONATIONS.LIST, page, pageSize, searchTerm),
        filters
      )
      const response = await api.get<{
        items: Donation[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get donations error:', error)
      throw error
    }
  }

  const getDonationSummary = async (searchTerm = '', filters: DonationFilters = {}) => {
    try {
      const endpoint = appendFilters(API_ENDPOINTS.DONATIONS.SUMMARY, { ...filters, ...(searchTerm ? { searchTerm } : {}) } as DonationFilters)
      const response = await api.get<DonationSummary>(endpoint)
      return response.data
    } catch (error) {
      console.error('Get donation summary error:', error)
      throw error
    }
  }

  const getDonationById = async (id: string) => {
    try {
      const response = await api.get<Donation>(API_ENDPOINTS.DONATIONS.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get donation error:', error)
      throw error
    }
  }

  const createDonation = async (donationData: CreateDonationRequest) => {
    try {
      const response = await api.post<Donation>(API_ENDPOINTS.DONATIONS.CREATE, donationData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create donation error:', error)
      throw error
    }
  }

  const updateDonation = async (id: string, donationData: UpdateDonationRequest) => {
    try {
      const response = await api.put<Donation>(API_ENDPOINTS.DONATIONS.UPDATE(id), donationData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update donation error:', error)
      throw error
    }
  }

  const deleteDonation = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.DONATIONS.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete donation error:', error)
      throw error
    }
  }

  return {
    getKindLabel,
    kindOptions,
    getDonations,
    getDonationSummary,
    getDonationById,
    createDonation,
    updateDonation,
    deleteDonation
  }
}
