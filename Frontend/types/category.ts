export interface Category {
  id: number
  name: string
  createdDate: string
}

export interface CreateCategoryRequest {
  name: string
}

export interface UpdateCategoryRequest {
  id: number
  name: string
}
