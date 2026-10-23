import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const useCategories = () => {
  const api = useApi()

  const getCategories = async (page = 1, pageSize = 1000, searchTerm = '') => {
    try {
      const endpoint = getPaginatedEndpoint(API_ENDPOINTS.CATEGORIES.LIST, page, pageSize, searchTerm)
      const response = await api.get<{
        items: Category[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get categories error:', error)
      throw error
    }
  }

  const getCategoryById = async (id: string) => {
    try {
      const response = await api.get<Category>(API_ENDPOINTS.CATEGORIES.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get category error:', error)
      throw error
    }
  }

  const createCategory = async (categoryData: CreateCategoryRequest) => {
    try {
      const response = await api.post<Category>(API_ENDPOINTS.CATEGORIES.CREATE, categoryData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  }

  const updateCategory = async (id: string, categoryData: UpdateCategoryRequest) => {
    try {
      const response = await api.put<Category>(API_ENDPOINTS.CATEGORIES.UPDATE(id), categoryData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update category error:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.CATEGORIES.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete category error:', error)
      throw error
    }
  }

  return {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
  }
}
