/** Yetki adları (backend PermissionDto.Name). İşlem ekleme/düzenleme/silme Vehicles.Update ister. */
export const VEHICLE_PERMISSIONS = {
  READ: 'Vehicles.Read',
  CREATE: 'Vehicles.Create',
  UPDATE: 'Vehicles.Update',
  DELETE: 'Vehicles.Delete',
} as const;
