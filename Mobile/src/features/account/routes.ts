// Profil, hesap ve ayar ekranlarının adresleri (yazılı route tipleri Metro açılınca üretilir).

import type { Href } from 'expo-router';

export const accountRoutes = {
  profile: '/profile' as Href,
  settings: '/settings' as Href,
  changePassword: '/change-password' as Href,
  changeEmail: '/change-email' as Href,
  sessions: '/sessions' as Href,
  exportData: '/export-data' as Href,
  deleteAccount: '/delete-account' as Href,
};
