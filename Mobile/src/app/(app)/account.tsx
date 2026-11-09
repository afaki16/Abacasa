import { Redirect } from 'expo-router';

import { accountRoutes } from '@/features/account/routes';

/** Eski "Hesap bilgileri" adresi: ad, soyad, telefon artık Profil ekranında düzenlenir. */
export default function AccountScreen() {
  return <Redirect href={accountRoutes.profile} />;
}
