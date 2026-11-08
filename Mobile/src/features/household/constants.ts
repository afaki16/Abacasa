/** Yetki adları (backend PermissionDto.Name). Hane oluşturma ve ayrılma yetki istemez. */
export const HOUSEHOLD_PERMISSIONS = {
  READ: 'Household.Read',
  /** Ad değiştirme, modüller ve Excel dışa aktarım (yalnızca yönetici). */
  UPDATE: 'Household.Update',
  DELETE: 'Household.Delete',
} as const;

export const HOUSEHOLD_MEMBER_PERMISSIONS = {
  /** Üyeler ve davetler listesi. */
  READ: 'HouseholdMembers.Read',
  /** Davet gönderme / yeniden gönderme. */
  CREATE: 'HouseholdMembers.Create',
  UPDATE: 'HouseholdMembers.Update',
  /** Üye çıkarma / davet iptali. */
  DELETE: 'HouseholdMembers.Delete',
} as const;

/** Excel dışa aktarımının önerilen dosya adı (web ile aynı). */
export const HOUSEHOLD_EXPORT_FILE_NAME = 'abacasa-hane.xlsx';
