/** Yetki adları (backend PermissionDto.Name). Kur kaydetme hem ekleme hem güncellemedir (Create). */
export const EXCHANGE_RATE_PERMISSIONS = {
  READ: 'ExchangeRates.Read',
  CREATE: 'ExchangeRates.Create',
  DELETE: 'ExchangeRates.Delete',
} as const;
