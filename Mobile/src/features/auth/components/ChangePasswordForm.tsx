import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type Control, type FieldPath } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCooldown } from '@/hooks/useCooldown';
import { useAuthStore } from '@/stores/authStore';

import { useChangePassword, useSendPasswordChangeCode } from '../hooks';
import { otpSchema, PASSWORD_HINT, withPasswordConfirmation } from '../validation';

const currentSchema = withPasswordConfirmation({
  currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
}).refine((v) => v.newPassword !== v.currentPassword, {
  path: ['newPassword'],
  message: 'Yeni şifre mevcut şifreden farklı olmalı',
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
          title="Mevcut şifremi hatırlamıyorum"
          variant="ghost"
          loading={sendCode.isPending}
          disabled={change.isPending}
          onPress={requestCode}
        />
      ) : (
        <View style={styles.row}>
          <Button
            title={cooldown.isActive ? `Kodu tekrar gönder (${cooldown.remaining})` : 'Kodu tekrar gönder'}
            variant="ghost"
            loading={sendCode.isPending}
            disabled={cooldown.isActive || change.isPending}
            onPress={requestCode}
          />
          <Button
            title="Mevcut şifremle değiştir"
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
  const { control, handleSubmit, setFocus } = useForm<CurrentValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  // handleSubmit DOM event tipi bekliyor; RN event'ini geçirmeden çağır.
  const submit = () => handleSubmit(onSubmit)();

  return (
    <>
      <Card title="Kimliğini doğrula">
        <FormField
          control={control}
          name="currentPassword"
          label="Mevcut şifre"
          secureTextEntry
          autoComplete="current-password"
          {...next(() => setFocus('newPassword'))}
        />
      </Card>
      <NewPasswordCard control={control} onNewPasswordNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <Button title="Şifreyi değiştir" loading={pending} onPress={submit} />
    </>
  );
}

function CodeForm({ email, pending, onSubmit }: { email?: string; pending: boolean; onSubmit: (v: CodeValues) => void }) {
  const { control, handleSubmit, setFocus } = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });
  const submit = () => handleSubmit(onSubmit)();

  return (
    <>
      <Card title="Doğrulama kodu" description={email ? `${email} adresine 6 haneli bir kod gönderdik.` : undefined}>
        <FormField
          control={control}
          name="code"
          label="Kod"
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          {...next(() => setFocus('newPassword'))}
        />
      </Card>
      <NewPasswordCard control={control} onNewPasswordNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <Button title="Şifreyi değiştir" loading={pending} onPress={submit} />
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
  return (
    <Card title="Yeni şifre belirle">
      <FormField
        control={control}
        name={'newPassword' as FieldPath<T>}
        label="Yeni şifre"
        hint={PASSWORD_HINT}
        secureTextEntry
        autoComplete="new-password"
        {...next(onNewPasswordNext)}
      />
      <FormField
        control={control}
        name={'confirmPassword' as FieldPath<T>}
        label="Yeni şifre (tekrar)"
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
