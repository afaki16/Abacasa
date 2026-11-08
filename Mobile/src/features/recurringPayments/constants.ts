/** Yetki adları (backend PermissionDto.Name). */
export const RECURRING_PAYMENT_PERMISSIONS = {
  READ: 'RecurringPayments.Read',
  CREATE: 'RecurringPayments.Create',
  UPDATE: 'RecurringPayments.Update',
  DELETE: 'RecurringPayments.Delete',
  /** Vade ödeme (POST /{id}/pay). */
  PAY: 'RecurringPaymentPayments.Create',
} as const;

/** Geri alma bağlı kaydı siler; kayıt türünün silme izni gerekir. */
export const LINKED_RECORD_DELETE_PERMISSIONS = {
  expense: 'Expenses.Delete',
  donation: 'Donations.Delete',
} as const;
