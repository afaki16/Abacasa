/** Yetki adları (backend PermissionDto.Name). Hareket ekleme/düzenleme/silme DonationFunds.Update ister. */
export const DONATION_FUND_PERMISSIONS = {
  READ: 'DonationFunds.Read',
  CREATE: 'DonationFunds.Create',
  UPDATE: 'DonationFunds.Update',
  DELETE: 'DonationFunds.Delete',
} as const;
