import { Stack } from 'expo-router';

import { useColors } from '@/constants/theme';

/** Anonim ekranlar. Login başlıksız; alt ekranlarda yalnızca yerel geri butonu olan sade başlık. */
export default function AuthLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        title: '',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
