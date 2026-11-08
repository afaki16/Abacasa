import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useResetPasswordWithCode, useSendPasswordResetCode } from '@/features/auth/hooks';
import { emailSchema, otpSchema, PASSWORD_HINT_KEY, withPasswordConfirmation } from '@/features/auth/validation';
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
  const { t } = useTranslation();
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
            Alert.alert(t('auth.forgotPassword.successTitle'), t('auth.forgotPassword.successMessage'), [
              { text: t('common.ok'), onPress: () => router.dismissTo('/login') },
            ]),
        },
      ),
    )();

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="heading">{t('auth.forgotPassword.title')}</Text>
        <Text muted>
          {email
            ? t('auth.forgotPassword.codeSent', { email })
            : t('auth.forgotPassword.intro')}
        </Text>
      </View>

      <FormError messages={(email ? reset.error : sendCode.error)?.messages} />

      {!email ? (
        <>
          <FormField
            control={emailForm.control}
            name="email"
            label={t('common.email')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={onSendCode}
          />
          <Button title={t('auth.forgotPassword.sendCode')} loading={sendCode.isPending} onPress={onSendCode} />
        </>
      ) : (
        <>
          <Card title={t('auth.password.codeSection')}>
            <FormField
              control={resetForm.control}
              name="code"
              label={t('auth.password.code')}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              {...next(() => resetForm.setFocus('newPassword'))}
            />
          </Card>
          <Card title={t('auth.password.newPasswordSection')}>
            <FormField
              control={resetForm.control}
              name="newPassword"
              label={t('auth.password.newPassword')}
              hint={t(PASSWORD_HINT_KEY)}
              secureTextEntry
              autoComplete="new-password"
              {...next(() => resetForm.setFocus('confirmPassword'))}
            />
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              label={t('auth.password.newPasswordConfirm')}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={onReset}
            />
          </Card>
          <Button title={t('auth.forgotPassword.submit')} loading={reset.isPending} onPress={onReset} />
          <Button
            title={
              cooldown.isActive
                ? t('auth.password.resendCodeCountdown', { seconds: cooldown.remaining })
                : t('auth.password.resendCode')
            }
            variant="ghost"
            disabled={cooldown.isActive || reset.isPending}
            loading={sendCode.isPending}
            onPress={() => requestCode(email)}
          />
          <Button
            title={t('auth.forgotPassword.differentEmail')}
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
