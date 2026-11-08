import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, FormError, Screen, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
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
        <Ionicons name="mail-unread-outline" size={56} color={Colors.primary} />
      </View>

      <View style={styles.texts}>
        <Text variant="heading" style={styles.center}>
          E-postanı doğrula
        </Text>
        <Text muted style={styles.center}>
          {email ? `${email} adresine` : 'E-posta adresine'} bir doğrulama bağlantısı gönderdik. Bağlantıyı açıp
          hesabını doğruladıktan sonra giriş yapabilirsin.
        </Text>
      </View>

      <FormError messages={resend.error?.messages} />
      {resend.isSuccess && !resend.isPending && (
        <Text variant="label" color={Colors.success} style={styles.center}>
          Doğrulama e-postası tekrar gönderildi.
        </Text>
      )}

      <Button title="Giriş ekranına dön" onPress={() => router.dismissTo('/login')} />
      <Button
        title={cooldown.isActive ? `E-postayı tekrar gönder (${cooldown.remaining})` : 'E-postayı tekrar gönder'}
        variant="ghost"
        disabled={!email || cooldown.isActive}
        loading={resend.isPending}
        onPress={() => resend.mutate(email, { onSuccess: start })}
      />
      <Text variant="caption" muted style={styles.center}>
        E-posta gelmediyse gereksiz (spam) klasörünü kontrol et.
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
