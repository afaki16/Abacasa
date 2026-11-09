import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { AuthHeader, InfoBanner, TextLink } from '@/features/auth/components/AuthParts';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { useLogout } from '@/features/auth/hooks';

/**
 * MustChangePassword açık kullanıcı yalnızca bu ekranı görür (kök layout guard'ı); geri dönüş yok.
 * Backend de kilitli: izinli uçlar dışındaki her istek 403 + 1014 döner.
 * Başarıda yönlendirme yok: yeniden girişle bayrak iner, guard (app)'e geçer.
 */
export default function ForceChangePasswordScreen() {
  const { t } = useTranslation();
  const logout = useLogout();

  return (
    <Screen scroll contentStyle={styles.content}>
      <AuthHeader title={t('authScreens.forceChangePassword.title')} />
      <InfoBanner>{t('authScreens.forceChangePassword.info')}</InfoBanner>

      <ChangePasswordForm temporaryPassword />

      <TextLink
        title={t('common.logout')}
        disabled={logout.isPending}
        onPress={() => logout.mutate()}
        style={styles.logout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  logout: { marginTop: -Spacing.sm },
});
