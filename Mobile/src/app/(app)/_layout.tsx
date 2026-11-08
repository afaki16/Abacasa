import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/**
 * Girişli kullanıcı ekranları. (tabs) sekmeli ana yapı; diğer ekranlar sekmelerin üstüne açılır
 * ve yerel başlık kullanır. Yeni modül ekranları bu grubun altına eklenir.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.background },
        contentStyle: { backgroundColor: Colors.surface },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ title: 'Hesap bilgileri' }} />
      <Stack.Screen name="change-password" options={{ title: 'Şifre değiştir' }} />
      <Stack.Screen name="sessions" options={{ title: 'Oturumlarım' }} />
      {/* Örnek modül (Kullanıcılar) — yeni modül eklerken Mobile/MODULE_CREATION_GUIDE.md */}
      <Stack.Screen name="users/index" options={{ title: 'Kullanıcılar' }} />
      <Stack.Screen name="users/new" options={{ title: 'Yeni kullanıcı' }} />
      <Stack.Screen name="users/[id]/index" options={{ title: 'Kullanıcı' }} />
      <Stack.Screen name="users/[id]/edit" options={{ title: 'Kullanıcıyı düzenle' }} />
    </Stack>
  );
}
