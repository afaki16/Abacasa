/** Yetki adları (backend PermissionDto.Name). Ödeme listesi Debts.Read ile okunur. */
export const DEBT_PERMISSIONS = {
  READ: 'Debts.Read',
  CREATE: 'Debts.Create',
  UPDATE: 'Debts.Update',
  DELETE: 'Debts.Delete',
} as const;

export const DEBT_PAYMENT_PERMISSIONS = {
  CREATE: 'DebtPayments.Create',
  UPDATE: 'DebtPayments.Update',
  DELETE: 'DebtPayments.Delete',
} as const;
