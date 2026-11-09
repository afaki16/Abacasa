import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, FormError, Icon, Screen, Text } from '@/components/ui';
import { FontFamily, makeStyles, Spacing, useColors } from '@/constants/theme';
import { TextLink } from '@/features/auth/components/AuthParts';
import { useResendVerification } from '@/features/auth/hooks';
import { formatCountdown, INLINE_MARKER, splitAroundMarker } from '@/features/auth/passwordRules';
import { useCooldown } from '@/hooks/useCooldown';
import { toast } from '@/stores/toastStore';

/**
 * "E-postanı kontrol et" (kayıt sonrası veya doğrulanmamış hesapla giriş denemesi).
 * Doğrulama e-postadaki linkle yapılır; link web uygulamasının /auth/verify-email sayfasını açar
 * (App:FrontendUrl). Kullanıcı doğruladıktan sonra buradan giriş ekranına döner.
 *
 * Parametreler: email, sent=1 (e-posta az önce gönderildi → yeniden gönder sayacı başlar, 60 sn).
 */
export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const { email = '', sent } = useLocalSearchParams<{ email?: string; sent?: string }>();
  const resend = useResendVerification();
  const cooldown = useCooldown();
  const { start } = cooldown;

  useEffect(() => {
    if (sent === '1') start();
  }, [sent, start]);

  const sentTo = splitAroundMarker(t('authScreens.verifyEmail.sentTo', { email: INLINE_MARKER }));
  const backToLogin = () => (router.canGoBack() ? router.dismissTo('/login') : router.replace('/login'));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.tile}>
        <Icon name="mark-email-unread" size={40} color={colors.primary} />
      </View>

      <Text accessibilityRole="header" style={[styles.title, styles.center]}>
        {t('authScreens.verifyEmail.title')}
      </Text>
      <Text muted style={styles.center}>
        {email ? (
          <>
            {sentTo[0]}
            <Text style={styles.email}>{email}</Text>
            {sentTo[1]}
          </>
        ) : (
          t('authScreens.verifyEmail.sentGeneric')
        )}
      </Text>

      <FormError messages={resend.error?.messages} />

      <Button
        title={
          cooldown.isActive
            ? t('authScreens.verifyEmail.resendCountdown', { time: formatCountdown(cooldown.remaining) })
            : t('authScreens.verifyEmail.resend')
        }
        variant="secondary"
        style={styles.resend}
        disabled={!email || cooldown.isActive}
        loading={resend.isPending}
        onPress={() =>
          resend.mutate(email, {
            onSuccess: () => {
              start();
              toast.success(t('authScreens.verifyEmail.resent'));
            },
          })
        }
      />
      <TextLink title={t('authScreens.verifyEmail.backToLogin')} onPress={backToLogin} />
      <Text variant="caption" muted style={styles.center}>
        {t('authScreens.verifyEmail.spamHint')}
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  content: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 14 },
  tile: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30 },
  email: { fontFamily: FontFamily.semibold, color: c.text },
  center: { textAlign: 'center' },
  resend: { alignSelf: 'stretch', marginTop: Spacing.md },
}));

