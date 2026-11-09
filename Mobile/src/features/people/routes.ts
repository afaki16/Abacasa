// Kişi route'ları (bkz. ledger/routes.ts).

import type { Href } from 'expo-router';

export const personRoutes = {
  index: '/people' as Href,
  new: '/people/new' as Href,
  edit: (id: number) => `/people/${id}` as Href,
};
