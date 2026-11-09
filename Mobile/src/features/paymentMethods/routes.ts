// Ödeme aracı route'ları (bkz. ledger/routes.ts).

import type { Href } from 'expo-router';

export const paymentMethodRoutes = {
  index: '/payment-methods' as Href,
  new: '/payment-methods/new' as Href,
  edit: (id: number) => `/payment-methods/${id}` as Href,
};
