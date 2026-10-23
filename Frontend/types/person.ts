export interface Person {
  id: number
  name: string
  relation?: string
  createdDate: string
}

export interface CreatePersonRequest {
  name: string
  relation?: string
}

export interface UpdatePersonRequest {
  id: number
  name: string
  relation?: string
}
