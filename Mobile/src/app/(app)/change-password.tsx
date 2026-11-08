import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';

/**
 * Şifre değiştirme. Backend tüm cihazlardaki oturumları kapatır; bu cihazda yeni şifreyle
 * otomatik yeniden girilir. Yeniden giriş olmazsa guard login'e götürür (yönlendirme gerekmez).
 */
export default function ChangePasswordScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll edges={['bottom']}>
      <Text muted>{t('auth.changePassword.intro')}</Text>
      <ChangePasswordForm
        onSuccess={(reloggedIn) => {
          if (!reloggedIn) return;
          Alert.alert(t('auth.changePassword.successTitle'), t('auth.changePassword.successMessage'), [
            { text: t('common.ok'), onPress: () => router.back() },
          ]);
        }}
      />
    </Screen>
  );
}
