import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/** Anonim ekranlar. Login başlıksız; alt ekranlarda yalnızca yerel geri butonu olan sade başlık. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        title: '',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
