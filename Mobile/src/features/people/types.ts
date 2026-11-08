// Backend: Abacasa.Application/Features/People/Dtos (PersonListDto, PersonDto, Create/UpdatePersonDto).

/** GET /api/People (liste öğesi). */
export interface Person {
  id: number;
  name: string;
  /** Yakınlık (eş, çocuk…); serbest metin. */
  relation: string | null;
  createdDate: string;
}

/** GET /api/People/{id}: liste alanları + denetim alanları. */
export interface PersonDetail extends Person {
  createdBy?: number | null;
  updatedDate?: string | null;
  updatedBy?: number | null;
}

export interface PersonListParams {
  searchTerm?: string;
}

export interface CreatePersonRequest {
  name: string;
  relation: string | null;
}

/** id yalnızca route için; gövdede backend yok sayar. */
export interface UpdatePersonRequest extends CreatePersonRequest {
  id: number;
}
