export interface Permission {
  id: string
  name: string
  displayName?: string
  description?: string
  resource: string
  action?: string
  type?: PermissionType
  fullPermission?: string
  isActive?: boolean
  assignedCount?: number
  createdDate?: string
}

/**
 * Backend JsonStringEnumConverter ile isim olarak gönderir (Domain/Common/Enums/PermissionType.cs).
 * Backend'de [Flags]; birleşik değerler "Read, Create" gibi virgüllü gelebilir.
 */
export enum PermissionType {
  None = 'None',
  Create = 'Create',
  Read = 'Read',
  Update = 'Update',
  Delete = 'Delete',
  ReadWrite = 'ReadWrite',
  FullAccess = 'FullAccess'
}
