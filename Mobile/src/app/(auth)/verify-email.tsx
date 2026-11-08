import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, FormError, Screen, Text } from '@/components/ui';
import { Spacing, useColors } from '@/constants/theme';
import { useResendVerification } from '@/features/auth/hooks';
import { useCooldown } from '@/hooks/useCooldown';

/**
 * "E-postanı doğrula" ekranı (kayıt sonrası veya doğrulanmamış hesapla giriş denemesi).
 * Doğrulama e-postadaki linkle yapılır; link web uygulamasının /auth/verify-email sayfasını açar
 * (App:FrontendUrl). Kullanıcı doğruladıktan sonra buradan giriş ekranına döner.
 *
 * Parametreler: email, sent=1 (e-posta az önce gönderildi → tekrar gönder sayacı başlar).
 */
export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { email = '', sent } = useLocalSearchParams<{ email?: string; sent?: string }>();
  const resend = useResendVerification();
  const cooldown = useCooldown();
  const { start } = cooldown;

  useEffect(() => {
    if (sent === '1') start();
  }, [sent, start]);

  return (
    <Screen edges={['bottom']} contentStyle={styles.content}>
      <View style={styles.icon}>
        <Ionicons name="mail-unread-outline" size={56} color={colors.primary} />
      </View>

      <View style={styles.texts}>
        <Text variant="heading" style={styles.center}>
          {t('auth.verifyEmail.title')}
        </Text>
        <Text muted style={styles.center}>
          {email ? t('auth.verifyEmail.sentTo', { email }) : t('auth.verifyEmail.sentGeneric')}
        </Text>
      </View>

      <FormError messages={resend.error?.messages} />
      {resend.isSuccess && !resend.isPending && (
        <Text variant="label" color={colors.success} style={styles.center}>
          {t('auth.verifyEmail.resent')}
        </Text>
      )}

      <Button title={t('auth.verifyEmail.backToLogin')} onPress={() => router.dismissTo('/login')} />
      <Button
        title={
          cooldown.isActive
            ? t('auth.verifyEmail.resendCountdown', { seconds: cooldown.remaining })
            : t('auth.verifyEmail.resend')
        }
        variant="ghost"
        disabled={!email || cooldown.isActive}
        loading={resend.isPending}
        onPress={() => resend.mutate(email, { onSuccess: start })}
      />
      <Text variant="caption" muted style={styles.center}>
        {t('auth.verifyEmail.spamHint')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  icon: { alignItems: 'center' },
  texts: { gap: Spacing.sm },
  center: { textAlign: 'center' },
});
