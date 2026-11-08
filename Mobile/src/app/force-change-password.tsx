import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { useLogout } from '@/features/auth/hooks';

/**
 * MustChangePassword açık kullanıcı yalnızca bu ekranı görür (kök layout guard'ı).
 * Backend de kilitli: izinli uçlar dışındaki her istek 403 + 1014 döner.
 * Başarıda yönlendirme yok: yeniden girişle bayrak iner, guard (app)'e geçer.
 */
export default function ForceChangePasswordScreen() {
  const { t } = useTranslation();
  const logout = useLogout();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="heading">{t('auth.forceChangePassword.title')}</Text>
        <Text muted>{t('auth.forceChangePassword.subtitle')}</Text>
      </View>

      <ChangePasswordForm />

      <Button title={t('common.logout')} variant="ghost" loading={logout.isPending} onPress={() => logout.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
});
