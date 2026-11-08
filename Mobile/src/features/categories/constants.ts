/** Yetki adları (backend PermissionDto.Name). */
export const CATEGORY_PERMISSIONS = {
  READ: 'Categories.Read',
  CREATE: 'Categories.Create',
  UPDATE: 'Categories.Update',
  DELETE: 'Categories.Delete',
} as const;

/** Seçici listeleri tek istekte alınır (web ile aynı; backend üst sınırı 1000). */
export const CATEGORY_OPTIONS_PAGE_SIZE = 1000;
