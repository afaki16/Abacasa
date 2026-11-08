/** Yetki adları (backend PermissionDto.Name). */
export const PAYMENT_METHOD_PERMISSIONS = {
  READ: 'PaymentMethods.Read',
  CREATE: 'PaymentMethods.Create',
  UPDATE: 'PaymentMethods.Update',
  DELETE: 'PaymentMethods.Delete',
} as const;

/** Seçici listeleri tek istekte alınır (web ile aynı; backend üst sınırı 1000). */
export const PAYMENT_METHOD_OPTIONS_PAGE_SIZE = 1000;
