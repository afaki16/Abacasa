/** Yetki adları (backend PermissionDto.Name). */
export const PERSON_PERMISSIONS = {
  READ: 'People.Read',
  CREATE: 'People.Create',
  UPDATE: 'People.Update',
  DELETE: 'People.Delete',
} as const;

/** Seçici listeleri tek istekte alınır (web ile aynı; backend üst sınırı 1000). */
export const PERSON_OPTIONS_PAGE_SIZE = 1000;
