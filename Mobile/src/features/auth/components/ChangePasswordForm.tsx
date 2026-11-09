import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, next, SegmentedControl, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCooldown } from '@/hooks/useCooldown';
import { toast } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';

import { useChangePassword, useSendPasswordChangeCode } from '../hooks';
import { formatCountdown } from '../passwordRules';
import { otpSchema, withPasswordConfirmation } from '../validation';
import { TextLink } from './AuthParts';
import { OtpInput } from './OtpInput';
import { PasswordFormField } from './PasswordFormField';

const currentSchema = withPasswordConfirmation({
  currentPassword: z.string().min(1, 'validation.password.currentRequired'),
}).refine((v) => v.newPassword !== v.currentPassword, {
  path: ['newPassword'],
  message: 'validation.password.sameAsCurrent',
});
const codeSchema = withPasswordConfirmation({ code: otpSchema });

type CurrentValues = z.infer<typeof currentSchema>;
type CodeValues = z.infer<typeof codeSchema>;
type Mode = 'current' | 'code';

export interface ChangePasswordFormProps {
  /** Başarıdan sonra (yeniden giriş yapıldıysa true). Yönlendirmeyi çağıran yapar. */
  onSuccess?: (reloggedIn: boolean) => void;
  /** Zorunlu değişim: mevcut şifre alanı "Geçici şifre" olarak etiketlenir. */
  temporaryPassword?: boolean;
}

/**
 * Şifre değiştirme: üstte yöntem seçimi (Mevcut şifreyle · E-posta koduyla). Kod yönteminde önce
 * e-postaya 6 haneli kod gönderilir. Backend tüm oturumları kapatır; useChangePassword yeni şifreyle
 * bu cihazda yeniden girer. Gönder düğmesi formun en altında durur (ekran boşluğu doldurur).
 */
export function ChangePasswordForm({ onSuccess, temporaryPassword }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('current');
  const [codeSent, setCodeSent] = useState(false);
  const change = useChangePassword();
  const sendCode = useSendPasswordChangeCode();
  const cooldown = useCooldown();
  const email = useAuthStore((s) => s.user?.email);

  const requestCode = (resend = false) =>
    sendCode.mutate(undefined, {
      onSuccess: () => {
        cooldown.start();
        setCodeSent(true);
        if (resend) toast.info(t('authScreens.forgotPassword.codeResent'));
      },
    });

  const done = { onSuccess: ({ reloggedIn }: { reloggedIn: boolean }) => onSuccess?.(reloggedIn) };

  return (
    <View style={styles.container}>
      <SegmentedControl<Mode>
        accessibilityLabel={t('authScreens.changePassword.modeLabel')}
        segments={[
          { value: 'current', label: t('authScreens.changePassword.withCurrent') },
          { value: 'code', label: t('authScreens.changePassword.withCode') },
        ]}
        value={mode}
        onChange={(value) => {
          change.reset();
          setMode(value);
        }}
        disabled={change.isPending}
      />

      <FormError messages={change.error?.messages ?? sendCode.error?.messages} />

      {mode === 'current' ? (
        <CurrentPasswordForm
          temporaryPassword={temporaryPassword}
          pending={change.isPending}
          onSubmit={({ currentPassword, newPassword }) =>
            change.mutate({ mode: 'current', currentPassword, newPassword }, done)
          }
        />
      ) : !codeSent ? (
        <View style={styles.fill}>
          <Text muted>
            {email
              ? t('authScreens.changePassword.codeIntro', { email })
              : t('authScreens.changePassword.codeIntroGeneric')}
          </Text>
          <View style={styles.spacer} />
          <Button
            title={t('authScreens.changePassword.sendCode')}
            loading={sendCode.isPending}
            onPress={() => requestCode()}
          />
        </View>
      ) : (
        <CodeForm
          email={email}
          pending={change.isPending}
          resend={
            <TextLink
              title={
                cooldown.isActive
                  ? t('authScreens.changePassword.resendCodeCountdown', { time: formatCountdown(cooldown.remaining) })
                  : t('authScreens.changePassword.resendCode')
              }
              muted={cooldown.isActive}
              disabled={cooldown.isActive || sendCode.isPending || change.isPending}
              onPress={() => requestCode(true)}
              style={styles.resend}
            />
          }
          onSubmit={({ code, newPassword }) => change.mutate({ mode: 'code', code, newPassword }, done)}
        />
      )}
    </View>
  );
}

function CurrentPasswordForm({
  temporaryPassword,
  pending,
  onSubmit,
}: {
  temporaryPassword?: boolean;
  pending: boolean;
  onSubmit: (v: CurrentValues) => void;
}) {
  const { t } = useTranslation();
  const { control, handleSubmit, setFocus } = useForm<CurrentValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  // handleSubmit DOM event tipi bekliyor; RN event'ini geçirmeden çağır.
  const submit = () => handleSubmit(onSubmit)();

  return (
    <View style={styles.fill}>
      <PasswordFormField
        control={control}
        name="currentPassword"
        label={t(
          temporaryPassword ? 'authScreens.changePassword.temporaryPassword' : 'authScreens.changePassword.currentPassword',
        )}
        autoComplete="current-password"
        textContentType="password"
        {...next(() => setFocus('newPassword'))}
      />
      <NewPasswordFields control={control} onNewPasswordNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <View style={styles.spacer} />
      <Button title={t('authScreens.changePassword.submit')} loading={pending} onPress={submit} />
    </View>
  );
}

function CodeForm({
  email,
  pending,
  resend,
  onSubmit,
}: {
  email?: string;
  pending: boolean;
  resend: ReactNode;
  onSubmit: (v: CodeValues) => void;
}) {
  const { t } = useTranslation();
  const { control, handleSubmit, setFocus } = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });
  const submit = () => handleSubmit(onSubmit)();

  return (
    <View style={styles.fill}>
      <Text muted>
        {email
          ? t('authScreens.changePassword.codeSentTo', { email })
          : t('authScreens.changePassword.codeSentGeneric')}
      </Text>
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <OtpInput
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
            autoFocus
            onComplete={() => setFocus('newPassword')}
          />
        )}
      />
      {resend}
      <NewPasswordFields control={control} onNewPasswordNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <View style={styles.spacer} />
      <Button title={t('authScreens.changePassword.submit')} loading={pending} onPress={submit} />
    </View>
  );
}

type NewPasswordFieldValues = { newPassword: string; confirmPassword: string };

/** Yeni şifre (canlı kurallarla) + tekrar; iki formda ortak. */
function NewPasswordFields<T extends NewPasswordFieldValues>({
  control,
  onNewPasswordNext,
  onSubmitEditing,
}: {
  control: Control<T>;
  onNewPasswordNext: () => void;
  onSubmitEditing: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <PasswordFormField
        control={control}
        name={'newPassword' as FieldPath<T>}
        label={t('authScreens.changePassword.newPassword')}
        rules="list"
        autoComplete="new-password"
        textContentType="newPassword"
        {...next(onNewPasswordNext)}
      />
      <PasswordFormField
        control={control}
        name={'confirmPassword' as FieldPath<T>}
        label={t('authScreens.changePassword.newPasswordConfirm')}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: Spacing.lg },
  fill: { flexGrow: 1, gap: Spacing.lg },
  spacer: { flexGrow: 1 },
  resend: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: -Spacing.sm },
});
