import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NavigatorStackHeader } from '@/components/navigation/StackHeader';
import { useColors } from '@/constants/theme';

/**
 * Girişli kullanıcı ekranları. (tabs) sekmeli ana yapı; diğer ekranlar sekmelerin üstüne açılır
 * ve kitin yığın üst barını (StackHeader) kullanır. Yeni modül ekranları bu grubun altına eklenir.
 * Başlık metinleri dile bağlı; dil ya da tema değişince navigator yeniden çizilir.
 */
export default function AppLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        header: (props) => <NavigatorStackHeader {...props} />,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
      <Stack.Screen name="account" options={{ title: t('account.title') }} />
      <Stack.Screen name="change-password" options={{ title: t('auth.changePassword.title') }} />
      <Stack.Screen name="sessions" options={{ title: t('sessions.title') }} />
      {/* Örnek modül (Kullanıcılar) — yeni modül eklerken Mobile/MODULE_CREATION_GUIDE.md */}
      <Stack.Screen name="users/index" options={{ title: t('users.title') }} />
      <Stack.Screen name="users/new" options={{ title: t('users.newTitle') }} />
      <Stack.Screen name="users/[id]/index" options={{ title: t('users.detailTitle') }} />
      <Stack.Screen name="users/[id]/edit" options={{ title: t('users.editTitle') }} />
    </Stack>
  );
}
