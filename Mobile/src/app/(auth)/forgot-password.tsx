import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BackHandler, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { StackHeader } from '@/components/navigation/StackHeader';
import { Button, FormError, FormField, next, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { AuthHeader, StepProgress, TextLink } from '@/features/auth/components/AuthParts';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { PasswordFormField } from '@/features/auth/components/PasswordFormField';
import { useResetPasswordWithCode, useSendPasswordResetCode } from '@/features/auth/hooks';
import { formatCountdown } from '@/features/auth/passwordRules';
import { emailSchema, withPasswordConfirmation } from '@/features/auth/validation';
import { useCooldown } from '@/hooks/useCooldown';
import { ErrorCode, isApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';

const emailFormSchema = z.object({ email: emailSchema });
const passwordFormSchema = withPasswordConfirmation({});

type EmailValues = z.infer<typeof emailFormSchema>;
type PasswordValues = z.infer<typeof passwordFormSchema>;
type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;
const CODE_LENGTH = 6;

/**
 * Şifremi unuttum, 3 adım: 1) e-posta → kod gönderilir  2) 6 haneli kod  3) yeni şifre.
 * Kod ayrı doğrulanmaz; 3. adımda şifreyle birlikte gönderilir. Kod hatalıysa (şifre kuralları
 * istemcide zaten doğrulandığı için doğrulama hatası koddandır) 2. adıma dönülür.
 * Backend hesap olmasa da "gönderildi" der (hesap varlığı sızmaz). Başarıda tüm oturumlar kapanır.
 * Üst bar ekranın kendisinde: geri önce önceki adıma döner.
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const sendCode = useSendPasswordResetCode();
  const reset = useResetPasswordWithCode();
  const cooldown = useCooldown();

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: params.email ?? '' },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const goBack = () => {
    if (step > 1) {
      reset.reset();
      setStep((s) => (s - 1) as Step);
    } else {
      router.back();
    }
  };

  // Android geri tuşu da önce önceki adıma döner.
  const clearResetError = reset.reset;
  useEffect(() => {
    if (step === 1) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      clearResetError();
      setStep((s) => (s - 1) as Step);
      return true;
    });
    return () => sub.remove();
  }, [step, clearResetError]);

  const requestCode = (target: string, resend = false) =>
    sendCode.mutate(target, {
      onSuccess: () => {
        setEmail(target);
        cooldown.start();
        if (resend) {
          toast.info(t('authScreens.forgotPassword.codeResent'));
        } else {
          setCode('');
          setCodeError(undefined);
          setStep(2);
        }
      },
    });

  const onSendCode = () => emailForm.handleSubmit(({ email: value }) => requestCode(value))();

  const onContinue = () => {
    if (code.length !== CODE_LENGTH) {
      setCodeError('validation.otp');
      return;
    }
    setCodeError(undefined);
    setStep(3);
  };

  const onReset = () =>
    passwordForm.handleSubmit(({ newPassword }) =>
      reset.mutate(
        { email, code, newPassword },
        {
          onSuccess: () => {
            toast.success(t('authScreens.forgotPassword.success'));
            if (router.canGoBack()) router.dismissTo({ pathname: '/login', params: { email } });
            else router.replace({ pathname: '/login', params: { email } });
          },
          onError: (error) => {
            if (isApiError(error, ErrorCode.ValidationFailed)) {
              setCodeError(error.messages[0]);
              setCode('');
              reset.reset();
              setStep(2);
            }
          },
        },
      ),
    )();

  return (
    <View style={styles.root}>
      <StackHeader title={t('authScreens.forgotPassword.title')} onBack={goBack} withInset />
      <Screen scroll edges={['bottom']} contentStyle={styles.content}>
        <StepProgress current={step} total={TOTAL_STEPS} />

        {step === 1 ? (
          <>
            <AuthHeader
              title={t('authScreens.forgotPassword.emailTitle')}
              subtitle={t('authScreens.forgotPassword.emailIntro')}
            />
            <FormError messages={sendCode.error?.messages} />
            <FormField
              control={emailForm.control}
              name="email"
              label={t('common.email')}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoFocus={!params.email}
              returnKeyType="send"
              onSubmitEditing={onSendCode}
            />
            <View style={styles.spacer} />
            <Button
              title={t('authScreens.forgotPassword.sendCode')}
              loading={sendCode.isPending}
              onPress={onSendCode}
            />
          </>
        ) : step === 2 ? (
          <>
            <AuthHeader
              title={t('authScreens.forgotPassword.codeTitle')}
              subtitle={t('authScreens.forgotPassword.codeIntro', { email })}
            />
            <FormError messages={sendCode.error?.messages} />
            <OtpInput
              value={code}
              onChange={(value) => {
                setCode(value);
                if (codeError) setCodeError(undefined);
              }}
              error={codeError}
              autoFocus
            />
            <TextLink
              title={
                cooldown.isActive
                  ? t('authScreens.forgotPassword.resendCodeCountdown', { time: formatCountdown(cooldown.remaining) })
                  : t('authScreens.forgotPassword.resendCode')
              }
              muted={cooldown.isActive}
              disabled={cooldown.isActive || sendCode.isPending}
              onPress={() => requestCode(email, true)}
              style={styles.inlineLink}
            />
            <View style={styles.spacer} />
            <Button
              title={t('authScreens.forgotPassword.continue')}
              disabled={code.length !== CODE_LENGTH}
              onPress={onContinue}
            />
          </>
        ) : (
          <>
            <AuthHeader title={t('authScreens.forgotPassword.newPasswordTitle')} />
            <FormError messages={reset.error?.messages} />
            <PasswordFormField
              control={passwordForm.control}
              name="newPassword"
              label={t('authScreens.forgotPassword.newPassword')}
              rules="list"
              autoComplete="new-password"
              textContentType="newPassword"
              autoFocus
              {...next(() => passwordForm.setFocus('confirmPassword'))}
            />
            <PasswordFormField
              control={passwordForm.control}
              name="confirmPassword"
              label={t('authScreens.forgotPassword.newPasswordConfirm')}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={onReset}
            />
            <View style={styles.spacer} />
            <Button title={t('authScreens.forgotPassword.submit')} loading={reset.isPending} onPress={onReset} />
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: Spacing.sm, gap: Spacing.lg },
  spacer: { flexGrow: 1 },
  inlineLink: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: -Spacing.sm },
});
