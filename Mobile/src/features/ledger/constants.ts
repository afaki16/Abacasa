/** Yetki adları (backend PermissionDto.Name). Hücre yazma Ledger.Update ister. */
export const LEDGER_PERMISSIONS = {
  READ: 'Ledger.Read',
  CREATE: 'Ledger.Create',
  UPDATE: 'Ledger.Update',
  DELETE: 'Ledger.Delete',
} as const;
