import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useResetPasswordWithCode, useSendPasswordResetCode } from '@/features/auth/hooks';
import { emailSchema, otpSchema, PASSWORD_HINT, withPasswordConfirmation } from '@/features/auth/validation';
import { useCooldown } from '@/hooks/useCooldown';

const emailFormSchema = z.object({ email: emailSchema });
const resetFormSchema = withPasswordConfirmation({ code: otpSchema });

type EmailValues = z.infer<typeof emailFormSchema>;
type ResetValues = z.infer<typeof resetFormSchema>;

/**
 * Şifremi unuttum (kodla): 1) e-posta → 6 haneli kod  2) kod + yeni şifre.
 * Backend hesap olmasa da "gönderildi" der (hesap varlığı sızmaz). Başarıda tüm oturumlar
 * kapanır; kullanıcı yeni şifreyle giriş yapar.
 */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState<string | null>(null);
  const sendCode = useSendPasswordResetCode();
  const reset = useResetPasswordWithCode();
  const cooldown = useCooldown();

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: params.email ?? '' },
  });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  const requestCode = (target: string) =>
    sendCode.mutate(target, {
      onSuccess: () => {
        setEmail(target);
        cooldown.start();
      },
    });

  const onSendCode = () => emailForm.handleSubmit(({ email: value }) => requestCode(value))();

  const onReset = () =>
    resetForm.handleSubmit(({ code, newPassword }) =>
      reset.mutate(
        { email: email!, code, newPassword },
        {
          onSuccess: () =>
            Alert.alert('Şifren güncellendi', 'Yeni şifrenle giriş yapabilirsin.', [
              { text: 'Tamam', onPress: () => router.dismissTo('/login') },
            ]),
        },
      ),
    )();

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="heading">Şifremi unuttum</Text>
        <Text muted>
          {email
            ? `${email} adresine bir hesap kayıtlıysa 6 haneli bir kod gönderdik.`
            : 'E-posta adresini gir, şifreni sıfırlaman için bir kod gönderelim.'}
        </Text>
      </View>

      <FormError messages={(email ? reset.error : sendCode.error)?.messages} />

      {!email ? (
        <>
          <FormField
            control={emailForm.control}
            name="email"
            label="E-posta"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={onSendCode}
          />
          <Button title="Kod gönder" loading={sendCode.isPending} onPress={onSendCode} />
        </>
      ) : (
        <>
          <Card title="Doğrulama kodu">
            <FormField
              control={resetForm.control}
              name="code"
              label="Kod"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              {...next(() => resetForm.setFocus('newPassword'))}
            />
          </Card>
          <Card title="Yeni şifre belirle">
            <FormField
              control={resetForm.control}
              name="newPassword"
              label="Yeni şifre"
              hint={PASSWORD_HINT}
              secureTextEntry
              autoComplete="new-password"
              {...next(() => resetForm.setFocus('confirmPassword'))}
            />
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              label="Yeni şifre (tekrar)"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={onReset}
            />
          </Card>
          <Button title="Şifreyi sıfırla" loading={reset.isPending} onPress={onReset} />
          <Button
            title={cooldown.isActive ? `Kodu tekrar gönder (${cooldown.remaining})` : 'Kodu tekrar gönder'}
            variant="ghost"
            disabled={cooldown.isActive || reset.isPending}
            loading={sendCode.isPending}
            onPress={() => requestCode(email)}
          />
          <Button
            title="Farklı bir e-posta gir"
            variant="ghost"
            disabled={reset.isPending}
            onPress={() => {
              setEmail(null);
              resetForm.reset();
            }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
});
