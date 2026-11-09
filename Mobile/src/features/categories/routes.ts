// Kategori route'ları (bkz. ledger/routes.ts).

import type { Href } from 'expo-router';

export const categoryRoutes = {
  index: '/categories' as Href,
  new: '/categories/new' as Href,
  edit: (id: number) => `/categories/${id}` as Href,
};
