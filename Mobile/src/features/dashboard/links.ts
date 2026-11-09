// Özet ve Harcamalar ekranlarının gittiği yollar. Bazıları başka ekran gruplarının route'larıdır;
// yazılı route tipleri (.expo/types) Metro başlayınca yenilenir, o zamana kadar Href'e çevrilir.

import { router, type Href } from 'expo-router';

export const ROUTES = {
  recurring: '/recurring',
  debts: '/debts',
  vehicles: '/vehicles',
  exchangeRates: '/exchange-rates',
  donations: '/donations',
  expenses: '/expenses',
  newExpense: '/expenses/new',
  byCategory: '/expenses/by-category',
  editExpense: (id: number) => `/expenses/${id}`,
} as const;

export function go(path: string): void {
  router.push(path as Href);
}
