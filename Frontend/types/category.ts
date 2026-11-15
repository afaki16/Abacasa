export interface Category {
  id: number
  name: string
  /** Seçilen ikon anahtarı (utils/categoryIcons); boşsa addan tahmin edilir */
  icon?: string | null
  createdDate: string
  usageCount?: number
}

export interface CreateCategoryRequest {
  name: string
  icon?: string | null
}

export interface UpdateCategoryRequest {
  id: number
  name: string
  icon?: string | null
}
