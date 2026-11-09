import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { PasswordChangeForm } from '@/features/account/components/PasswordChangeForm';
import { toast } from '@/stores/toastStore';

/**
 * Şifre değiştir: mevcut şifreyle ya da e-posta koduyla. Backend tüm cihazlardaki oturumları kapatır; bu cihazda
 * yeni şifreyle otomatik yeniden girilir. Yeniden giriş olmazsa guard login'e götürür (yönlendirme gerekmez).
 */
export default function ChangePasswordScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll edges={['bottom']} contentStyle={{ paddingHorizontal: 20, paddingTop: Spacing.xs }}>
      <Stack.Screen options={{ title: t('profileScreen.password.title') }} />
      <PasswordChangeForm
        onSuccess={(reloggedIn) => {
          if (!reloggedIn) return;
          toast.success(t('profileScreen.password.changed'));
          router.back();
        }}
      />
    </Screen>
  );
}
