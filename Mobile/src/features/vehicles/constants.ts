import type { IconName } from '@/components/ui';
import type { VehicleType } from '@/lib/domain/enums';

/** Araç türü ikonu; tür gelmezse (eski istemci verisi) otomobil. */
export const VEHICLE_TYPE_ICONS: Record<VehicleType, IconName> = {
  Car: 'directions-car',
  Motorcycle: 'two-wheeler',
  LightCommercial: 'airport-shuttle',
  Truck: 'local-shipping',
  Other: 'commute',
};

export function vehicleTypeIcon(type: VehicleType | null | undefined): IconName {
  return (type && VEHICLE_TYPE_ICONS[type]) || 'directions-car';
}

/** Yetki adları (backend PermissionDto.Name). İşlem ekleme/düzenleme/silme Vehicles.Update ister. */
export const VEHICLE_PERMISSIONS = {
  READ: 'Vehicles.Read',
  CREATE: 'Vehicles.Create',
  UPDATE: 'Vehicles.Update',
  DELETE: 'Vehicles.Delete',
} as const;
