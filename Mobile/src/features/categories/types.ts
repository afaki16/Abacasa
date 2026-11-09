// Backend: Abacasa.Application/Features/Categories/Dtos (CategoryListDto, CategoryDto, Create/UpdateCategoryDto).

/** GET /api/Categories (liste öğesi). */
export interface Category {
  id: number;
  name: string;
  createdDate: string;
  /** Bağlı harcama + sabit ödeme sayısı; yalnızca listede gelir. */
  usageCount?: number;
}

/** GET /api/Categories/{id}: liste alanları + denetim alanları. */
export interface CategoryDetail extends Category {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

export interface CategoryListParams {
  searchTerm?: string;
}

export interface CreateCategoryRequest {
  name: string;
}

/** id yalnızca route için; gövdede backend yok sayar. */
export interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: number;
}
