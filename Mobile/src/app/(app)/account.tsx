import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, Screen, TextField } from '@/components/ui';
import { useUpdateProfile } from '@/features/auth/hooks';
import { nameSchema, phoneSchema, toNullable } from '@/features/auth/validation';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  firstName: nameSchema('firstName'),
  lastName: nameSchema('lastName'),
  phoneNumber: phoneSchema,
});

type FormValues = z.infer<typeof schema>;

/** Ad, soyad, telefon. E-posta burada salt okunur (değişikliği doğrulama gerektirir). */
export default function AccountScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();

  const { control, handleSubmit, formState, setFocus } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  });

  const onSubmit = () =>
    handleSubmit((values) =>
      update.mutate({ ...values, phoneNumber: toNullable(values.phoneNumber) }, { onSuccess: () => router.back() }),
    )();

  return (
    <Screen scroll edges={['bottom']}>
      <FormError messages={update.error?.messages} />

      <Card title={t('common.personalInfo')}>
        <FormField
          control={control}
          name="firstName"
          label={t('common.firstName')}
          autoComplete="given-name"
          {...next(() => setFocus('lastName'))}
        />
        <FormField
          control={control}
          name="lastName"
          label={t('common.lastName')}
          autoComplete="family-name"
          {...next(() => setFocus('phoneNumber'))}
        />
      </Card>

      <Card title={t('common.contact')}>
        <TextField
          label={t('common.email')}
          value={user?.email ?? ''}
          editable={false}
          hint={t('account.emailHint')}
        />
        <FormField
          control={control}
          name="phoneNumber"
          label={t('common.phoneOptional')}
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </Card>

      <Button title={t('common.save')} loading={update.isPending} disabled={!formState.isDirty} onPress={onSubmit} />
    </Screen>
  );
}
