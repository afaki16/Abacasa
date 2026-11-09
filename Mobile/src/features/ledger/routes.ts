// Yıllık tablo route'ları. Yazılı route tipleri (.expo/types) Metro başlayınca üretilir; yeni route'lar
// o zamana kadar Href tipinde görünmez, bu yüzden yollar burada tek noktadan Href'e çevrilir.

import type { Href } from 'expo-router';

export const ledgerRoutes = {
  index: '/ledger' as Href,
  newItem: (year: number) => `/ledger/new?year=${year}` as Href,
  item: (id: number, year: number) => `/ledger/${id}?year=${year}` as Href,
};
