// Araç route'ları (bkz. ledger/routes.ts: yazılı route tipleri üretilene kadar Href'e çevrim tek noktada).

import type { Href } from 'expo-router';

export const vehicleRoutes = {
  index: '/vehicles' as Href,
  new: '/vehicles/new' as Href,
  detail: (id: number) => `/vehicles/${id}` as Href,
  edit: (id: number) => `/vehicles/${id}/edit` as Href,
  newObligation: (vehicleId: number) => `/vehicles/${vehicleId}/obligations/new` as Href,
  obligation: (vehicleId: number, obligationId: number) =>
    `/vehicles/${vehicleId}/obligations/${obligationId}` as Href,
};
