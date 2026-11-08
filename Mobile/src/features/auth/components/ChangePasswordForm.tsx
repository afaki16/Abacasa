import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type Control, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCooldown } from '@/hooks/useCooldown';
import { useAuthStore } from '@/stores/authStore';

import { useChangePassword, useSendPasswordChangeCode } from '../hooks';
import { otpSchema, PASSWORD_HINT_KEY, withPasswordConfirmation } from '../validation';

const currentSchema = withPasswordConfirmation({
  currentPassword: z.string().min(1, 'validation.password.currentRequired'),
}).refine((v) => v.newPassword !== v.currentPassword, {
  path: ['newPassword'],
  message: 'validation.password.sameAsCurrent',
});
const codeSchema = withPasswordConfirmation({ code: otpSchema });

type CurrentValues = z.infer<typeof currentSchema>;
type CodeValues = z.infer<typeof codeSchema>;

export interface ChangePasswordFormProps {
  /** Başarıdan sonra (yeniden giriş yapıldıysa true). Yönlendirmeyi çağıran yapar. */
  onSuccess?: (reloggedIn: boolean) => void;
}

/**
 * Şifre değiştirme: mevcut şifreyle ya da (hatırlamıyorsa) e-postaya gelen kodla.
 * Backend tüm oturumları kapatır; useChangePassword yeni şifreyle bu cihazda yeniden girer.
 */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'current' | 'code'>('current');
  const change = useChangePassword();
  const sendCode = useSendPasswordChangeCode();
  const cooldown = useCooldown();
  const email = useAuthStore((s) => s.user?.email);

  const requestCode = () =>
    sendCode.mutate(undefined, {
      onSuccess: () => {
        cooldown.start();
        setMode('code');
      },
    });

  const done = { onSuccess: ({ reloggedIn }: { reloggedIn: boolean }) => onSuccess?.(reloggedIn) };

  return (
    <View style={styles.container}>
      <FormError messages={change.error?.messages ?? sendCode.error?.messages} />

      {mode === 'current' ? (
        <CurrentPasswordForm
          pending={change.isPending}
          onSubmit={({ currentPassword, newPassword }) =>
            change.mutate({ mode: 'current', currentPassword, newPassword }, done)
          }
        />
      ) : (
        <CodeForm
          email={email}
          pending={change.isPending}
          onSubmit={({ code, newPassword }) => change.mutate({ mode: 'code', code, newPassword }, done)}
        />
      )}

      {mode === 'current' ? (
        <Button
          title={t('auth.changePassword.forgotCurrent')}
          variant="ghost"
          loading={sendCode.isPending}
          disabled={change.isPending}
          onPress={requestCode}
        />
      ) : (
        <View style={styles.row}>
          <Button
            title={
              cooldown.isActive
                ? t('auth.password.resendCodeCountdown', { seconds: cooldown.remaining })
                : t('auth.password.resendCode')
            }
            variant="ghost"
            loading={sendCode.isPending}
            disabled={cooldown.isActive || change.isPending}
            onPress={requestCode}
          />
          <Button
            title={t('auth.changePassword.useCurrent')}
            variant="ghost"
            disabled={change.isPending}
            onPress={() => setMode('current')}
          />
        </View>
      )}
    </View>
  );
}

function CurrentPasswordForm({ pending, onSubmit }: { pending: boolean; onSubmit: (v: CurrentValues) => void }) {
  const { t } = useTranslation();
  const { control, handleSubmit, setFocus } = useForm<CurrentValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  // handleSubmit DOM event tipi bekliyor; RN event'ini geçirmeden çağır.
  const submit = () => handleSubmit(onSubmit)();

  return (
    <>
      <Card title={t('auth.changePassword.verifySection')}>
        <FormField
          control={control}
          name="currentPassword"
          label={t('auth.changePassword.currentPassword')}
          secureTextEntry
          autoComplete="current-password"
          {...next(() => setFocus('newPassword'))}
        />
      </Card>
      <NewPasswordCard control={control} onNewPasswordNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <Button title={t('auth.changePassword.submit')} loading={pending} onPress={submit} />
    </>
  );
}

function CodeForm({ email, pending, onSubmit }: { email?: string; pending: boolean; onSubmit: (v: CodeValues) => void }) {
  const { t } = useTranslation();
  const { control, handleSubmit, setFocus } = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });
  const submit = () => handleSubmit(onSubmit)();

  return (
    <>
      <Card
        title={t('auth.password.codeSection')}
        description={email ? t('auth.changePassword.codeSentTo', { email }) : undefined}
      >
        <FormField
          control={control}
          name="code"
          label={t('auth.password.code')}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          {...next(() => setFocus('newPassword'))}
        />
      </Card>
      <NewPasswordCard control={control} onNewPasswordNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <Button title={t('auth.changePassword.submit')} loading={pending} onPress={submit} />
    </>
  );
}

type NewPasswordFields = { newPassword: string; confirmPassword: string };

/** Yeni şifre + tekrar; iki formda ortak. */
function NewPasswordCard<T extends NewPasswordFields>({
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
    <Card title={t('auth.password.newPasswordSection')}>
      <FormField
        control={control}
        name={'newPassword' as FieldPath<T>}
        label={t('auth.password.newPassword')}
        hint={t(PASSWORD_HINT_KEY)}
        secureTextEntry
        autoComplete="new-password"
        {...next(onNewPasswordNext)}
      />
      <FormField
        control={control}
        name={'confirmPassword' as FieldPath<T>}
        label={t('auth.password.newPasswordConfirm')}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={onSubmitEditing}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  row: { gap: Spacing.xs },
});
