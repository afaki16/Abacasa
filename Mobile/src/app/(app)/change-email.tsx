import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField, next, Screen, TextField } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { InfoNote } from '@/features/account/components/SettingsKit';
import { useRequestEmailChange } from '@/features/account/hooks';
import { mapFieldErrors } from '@/features/account/serverErrors';
import { emailSchema } from '@/features/auth/validation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

type FormValues = { newEmail: string; currentPassword: string };

const SERVER_FIELDS = { NewEmail: 'newEmail', CurrentPassword: 'currentPassword' } as const;

/**
 * E-posta değiştir: yeni adres + mevcut şifre. Yeni adrese doğrulama bağlantısı gider; bağlantı açılana kadar
 * mevcut adres geçerli kalır (onaylanınca tüm oturumlar kapanır).
 */
export default function ChangeEmailScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const currentEmail = useAuthStore((s) => s.user?.email ?? '');
  const request = useRequestEmailChange();
  const [formErrors, setFormErrors] = useState<string[]>();

  const schema = z
    .object({
      newEmail: z.string().trim().pipe(emailSchema),
      currentPassword: z.string().min(1, 'validation.password.currentRequired'),
    })
    .refine((v) => v.newEmail.toLowerCase() !== currentEmail.toLowerCase(), {
      path: ['newEmail'],
      message: 'profileScreen.email.sameAsCurrent',
    });

  const { control, handleSubmit, setFocus, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newEmail: '', currentPassword: '' },
  });

  const submit = () =>
    handleSubmit((values) => {
      setFormErrors(undefined);
      request.mutate(values, {
        onSuccess: () => {
          toast.success(t('profileScreen.email.sent', { email: values.newEmail.trim().toLowerCase() }));
          router.back();
        },
        onError: (error) => {
          const { fields, rest } = mapFieldErrors<keyof FormValues>(error.fieldErrors, SERVER_FIELDS);
          fields.forEach((f) => setError(f.name, { message: f.message }));
          setFormErrors(fields.length > 0 ? (rest.length > 0 ? rest : undefined) : error.messages);
        },
      });
    })();

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.content}>
      <Stack.Screen options={{ title: t('profileScreen.email.title') }} />
      <FormError messages={formErrors} />
      <TextField label={t('profileScreen.email.current')} value={currentEmail} editable={false} />
      <FormField
        control={control}
        name="newEmail"
        label={t('profileScreen.email.new')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        maxLength={100}
        {...next(() => setFocus('currentPassword'))}
      />
      <FormField
        control={control}
        name="currentPassword"
        label={t('profileScreen.email.password')}
        secureTextEntry
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <InfoNote icon="info">{t('profileScreen.email.info')}</InfoNote>
      <View style={styles.spacer} />
      <Button title={t('profileScreen.email.submit')} loading={request.isPending} onPress={submit} />
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  content: { paddingHorizontal: 20, paddingTop: Spacing.xs, gap: 14 },
  spacer: { flex: 1 },
}));
