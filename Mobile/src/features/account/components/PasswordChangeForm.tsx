import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch, type Control, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField, Icon, next, SegmentedControl, Text } from '@/components/ui';
import { FontFamily, makeStyles, Spacing, useColors } from '@/constants/theme';
import { useChangePassword, useSendPasswordChangeCode } from '@/features/auth/hooks';
import { otpSchema, withPasswordConfirmation } from '@/features/auth/validation';
import { useCooldown } from '@/hooks/useCooldown';
import type { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

import { passwordRuleStates } from '../passwordRules';
import { mapFieldErrors } from '../serverErrors';
import { InlineTextButton } from './SettingsKit';

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

export interface PasswordChangeFormProps {
  /** Başarıdan sonra (yeniden giriş yapıldıysa true). Yönlendirmeyi çağıran yapar. */
  onSuccess?: (reloggedIn: boolean) => void;
}

/**
 * Şifre değiştir (Hane ve Profil · Şifre değiştir): "Mevcut şifreyle" / "E-posta koduyla" segmenti, canlı şifre
 * kuralları, tekrar alanı. Kod sekmesine geçince kod e-postaya gönderilir (60 sn'de bir yeniden).
 * Backend tüm oturumları kapatır; useChangePassword bu cihazda yeni şifreyle yeniden girer.
 */
export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [mode, setMode] = useState<Mode>('current');
  const [codeSent, setCodeSent] = useState(false);
  const change = useChangePassword();
  const sendCode = useSendPasswordChangeCode();
  const cooldown = useCooldown();

  const requestCode = () =>
    sendCode.mutate(undefined, {
      onSuccess: () => {
        cooldown.start();
        setCodeSent(true);
      },
    });

  const selectMode = (value: Mode) => {
    setMode(value);
    change.reset();
    if (value === 'code' && !codeSent && !sendCode.isPending) requestCode();
  };

  const handlers = (onError: (error: ApiError) => void) => ({
    onSuccess: ({ reloggedIn }: { reloggedIn: boolean }) => onSuccess?.(reloggedIn),
    onError,
  });

  return (
    <View style={styles.container}>
      <SegmentedControl
        accessibilityLabel={t('profileScreen.password.method')}
        segments={[
          { value: 'current', label: t('profileScreen.password.withCurrent') },
          { value: 'code', label: t('profileScreen.password.withCode') },
        ]}
        value={mode}
        onChange={selectMode}
        disabled={change.isPending}
      />
      {mode === 'current' ? (
        <CurrentForm
          pending={change.isPending}
          onSubmit={({ currentPassword, newPassword }, onError) =>
            change.mutate({ mode: 'current', currentPassword, newPassword }, handlers(onError))
          }
        />
      ) : (
        <CodeForm
          pending={change.isPending}
          sendError={sendCode.error}
          codeSent={codeSent}
          resendLabel={
            cooldown.isActive
              ? t('profileScreen.password.resendIn', { time: `0:${String(cooldown.remaining).padStart(2, '0')}` })
              : t('profileScreen.password.resend')
          }
          resendDisabled={cooldown.isActive || sendCode.isPending || change.isPending}
          onResend={requestCode}
          onSubmit={({ code, newPassword }, onError) => change.mutate({ mode: 'code', code, newPassword }, handlers(onError))}
        />
      )}
    </View>
  );
}

/** Sunucu hatası: ilgili alana, eşlenemeyen form üstüne. */
function serverErrorMapper<T extends Record<string, unknown>>(
  setError: (name: FieldPath<T>, error: { message: string }) => void,
  mapping: Record<string, FieldPath<T>>,
) {
  return (error: ApiError): string[] | undefined => {
    const { fields, rest } = mapFieldErrors(error.fieldErrors, mapping);
    fields.forEach((f) => setError(f.name, { message: f.message }));
    return fields.length > 0 ? (rest.length > 0 ? rest : undefined) : error.messages;
  };
}

function CurrentForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (v: CurrentValues, onError: (error: ApiError) => void) => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { control, handleSubmit, setFocus, setError } = useForm<CurrentValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const toMessages = serverErrorMapper<CurrentValues>(setError, {
    CurrentPassword: 'currentPassword',
    NewPassword: 'newPassword',
  });
  const [messages, setMessages] = useState<string[]>();
  const submit = () =>
    handleSubmit((values) => {
      setMessages(undefined);
      onSubmit(values, (e) => setMessages(toMessages(e)));
    })();

  return (
    <>
      <FormError messages={messages} />
      <FormField
        control={control}
        name="currentPassword"
        label={t('auth.changePassword.currentPassword')}
        secureTextEntry
        autoComplete="current-password"
        {...next(() => setFocus('newPassword'))}
      />
      <NewPasswordFields control={control} onNewNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <View style={styles.spacer} />
      <Button title={t('profileScreen.password.submit')} loading={pending} onPress={submit} />
    </>
  );
}

function CodeForm({
  pending,
  sendError,
  codeSent,
  resendLabel,
  resendDisabled,
  onResend,
  onSubmit,
}: {
  pending: boolean;
  sendError: ApiError | null;
  codeSent: boolean;
  resendLabel: string;
  resendDisabled: boolean;
  onResend: () => void;
  onSubmit: (v: CodeValues, onError: (error: ApiError) => void) => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const email = useAuthStore((s) => s.user?.email);
  const { control, handleSubmit, setFocus, setError } = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });
  const toMessages = serverErrorMapper<CodeValues>(setError, { Code: 'code', NewPassword: 'newPassword' });
  const [messages, setMessages] = useState<string[]>();
  const submit = () =>
    handleSubmit((values) => {
      setMessages(undefined);
      onSubmit(values, (e) => setMessages(toMessages(e)));
    })();

  return (
    <>
      <FormError messages={messages ?? sendError?.messages} />
      <View style={styles.codeBlock}>
        <FormField
          control={control}
          name="code"
          label={t('profileScreen.password.code')}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          style={styles.codeInput}
          {...next(() => setFocus('newPassword'))}
        />
        <View style={styles.codeMeta}>
          <Text variant="caption" muted style={styles.codeSentTo} numberOfLines={2}>
            {codeSent && email ? t('profileScreen.password.codeSentTo', { email }) : ''}
          </Text>
          <InlineTextButton label={resendLabel} onPress={onResend} disabled={resendDisabled} />
        </View>
      </View>
      <NewPasswordFields control={control} onNewNext={() => setFocus('confirmPassword')} onSubmitEditing={submit} />
      <View style={styles.spacer} />
      <Button title={t('profileScreen.password.submit')} loading={pending} onPress={submit} />
    </>
  );
}

type NewPasswordValues = { newPassword: string; confirmPassword: string };

/** Yeni şifre (+ canlı kural listesi) ve tekrar; iki formda ortak. */
function NewPasswordFields<T extends NewPasswordValues>({
  control,
  onNewNext,
  onSubmitEditing,
}: {
  control: Control<T>;
  onNewNext: () => void;
  onSubmitEditing: () => void;
}) {
  const { t } = useTranslation();
  const newPassword = useWatch({ control, name: 'newPassword' as FieldPath<T> }) as string | undefined;
  return (
    <>
      <View style={{ gap: Spacing.sm }}>
        <FormField
          control={control}
          name={'newPassword' as FieldPath<T>}
          label={t('auth.password.newPassword')}
          secureTextEntry
          autoComplete="new-password"
          {...next(onNewNext)}
        />
        <PasswordRules password={newPassword ?? ''} />
      </View>
      <FormField
        control={control}
        name={'confirmPassword' as FieldPath<T>}
        label={t('auth.password.newPasswordConfirm')}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

/** Şifre kuralları: karşılananlar yeşil onay, kalanlar boş daire (iki sütun). */
export function PasswordRules({ password }: { password: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.rules} accessibilityRole="summary">
      {passwordRuleStates(password).map((rule) => {
        const label = t(`profileScreen.password.rules.${rule.key}`);
        return (
          <View
            key={rule.key}
            style={styles.rule}
            accessible
            accessibilityLabel={`${label}: ${rule.ok ? t('profileScreen.password.ruleMet') : t('profileScreen.password.ruleUnmet')}`}
          >
            <Icon
              name={rule.ok ? 'check-circle' : 'radio-button-unchecked'}
              size={16}
              color={rule.ok ? colors.badges.paid.fg : colors.placeholder}
            />
            <Text variant="caption" color={rule.ok ? colors.badges.paid.fg : colors.placeholder}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { flexGrow: 1, gap: 14 },
  spacer: { flexGrow: 1, minHeight: Spacing.sm },
  codeBlock: { gap: 2 },
  codeInput: { fontFamily: FontFamily.semibold, fontSize: 20, letterSpacing: 6, fontVariant: ['tabular-nums'] },
  codeMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  codeSentTo: { flex: 1 },
  rules: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, paddingTop: 2 },
  rule: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6 },
}));
