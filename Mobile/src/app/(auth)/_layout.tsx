import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NavigatorStackHeader } from '@/components/navigation/StackHeader';
import { useColors } from '@/constants/theme';

/**
 * Anonim ekranlar. Kayıt kitin yığın üst barını (StackBar) kullanır; giriş ve "e-postanı kontrol et"
 * başlıksız. Şifremi unuttum kendi üst barını çizer (geri düğmesi önce önceki adıma döner).
 */
export default function AuthLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        header: (props) => <NavigatorStackHeader {...props} />,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: t('authScreens.register.title') }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
    </Stack>
  );
}
