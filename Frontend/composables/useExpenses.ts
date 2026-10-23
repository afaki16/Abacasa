import type { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters, ExpenseSummary } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

// Boş olmayan filtreleri query string'e ekler
const appendFilters = (endpoint: string, filters: ExpenseFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  })
  const query = params.toString()
  if (!query) return endpoint
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`
}

export const useExpenses = () => {
  const api = useApi()

  const getExpenses = async (page = 1, pageSize = 10, searchTerm = '', filters: ExpenseFilters = {}) => {
    try {
      const endpoint = appendFilters(
        getPaginatedEndpoint(API_ENDPOINTS.EXPENSES.LIST, page, pageSize, searchTerm),
        filters
      )
      const response = await api.get<{
        items: Expense[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get expenses error:', error)
      throw error
    }
  }

  const getExpenseSummary = async (searchTerm = '', filters: ExpenseFilters = {}) => {
    try {
      const endpoint = appendFilters(API_ENDPOINTS.EXPENSES.SUMMARY, { ...filters, ...(searchTerm ? { searchTerm } : {}) } as ExpenseFilters)
      const response = await api.get<ExpenseSummary>(endpoint)
      return response.data
    } catch (error) {
      console.error('Get expense summary error:', error)
      throw error
    }
  }

  const getExpenseById = async (id: string) => {
    try {
      const response = await api.get<Expense>(API_ENDPOINTS.EXPENSES.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get expense error:', error)
      throw error
    }
  }

  const createExpense = async (expenseData: CreateExpenseRequest) => {
    try {
      const response = await api.post<Expense>(API_ENDPOINTS.EXPENSES.CREATE, expenseData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create expense error:', error)
      throw error
    }
  }

  const updateExpense = async (id: string, expenseData: UpdateExpenseRequest) => {
    try {
      const response = await api.put<Expense>(API_ENDPOINTS.EXPENSES.UPDATE(id), expenseData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update expense error:', error)
      throw error
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.EXPENSES.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete expense error:', error)
      throw error
    }
  }

  return {
    getExpenses,
    getExpenseSummary,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
  }
}
