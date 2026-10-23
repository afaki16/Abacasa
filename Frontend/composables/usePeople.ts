import type { Person, CreatePersonRequest, UpdatePersonRequest } from '~/types'
import { API_ENDPOINTS, getPaginatedEndpoint } from '~/utils/apiEndpoints'
import { useApi } from './useApi'

export const usePeople = () => {
  const api = useApi()

  const getPeople = async (page = 1, pageSize = 1000, searchTerm = '') => {
    try {
      const endpoint = getPaginatedEndpoint(API_ENDPOINTS.PEOPLE.LIST, page, pageSize, searchTerm)
      const response = await api.get<{
        items: Person[]
        totalCount: number
        totalPages: number
        pageNumber: number
      }>(endpoint)
      return response
    } catch (error) {
      console.error('Get people error:', error)
      throw error
    }
  }

  const getPersonById = async (id: string) => {
    try {
      const response = await api.get<Person>(API_ENDPOINTS.PEOPLE.GET_BY_ID(id))
      return response.data
    } catch (error) {
      console.error('Get person error:', error)
      throw error
    }
  }

  const createPerson = async (personData: CreatePersonRequest) => {
    try {
      const response = await api.post<Person>(API_ENDPOINTS.PEOPLE.CREATE, personData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Create person error:', error)
      throw error
    }
  }

  const updatePerson = async (id: string, personData: UpdatePersonRequest) => {
    try {
      const response = await api.put<Person>(API_ENDPOINTS.PEOPLE.UPDATE(id), personData)
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('Update person error:', error)
      throw error
    }
  }

  const deletePerson = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.PEOPLE.DELETE(id))
      return true
    } catch (error) {
      console.error('Delete person error:', error)
      throw error
    }
  }

  return {
    getPeople,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson
  }
}
