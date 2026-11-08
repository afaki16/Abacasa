import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, Screen, TextField } from '@/components/ui';
import { useUpdateProfile } from '@/features/auth/hooks';
import { nameSchema, phoneSchema, toNullable } from '@/features/auth/validation';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  firstName: nameSchema('Ad'),
  lastName: nameSchema('Soyad'),
  phoneNumber: phoneSchema,
});

type FormValues = z.infer<typeof schema>;

/** Ad, soyad, telefon. E-posta burada salt okunur (değişikliği doğrulama gerektirir). */
export default function AccountScreen() {
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

      <Card title="Kişisel bilgiler">
        <FormField
          control={control}
          name="firstName"
          label="Ad"
          autoComplete="given-name"
          {...next(() => setFocus('lastName'))}
        />
        <FormField
          control={control}
          name="lastName"
          label="Soyad"
          autoComplete="family-name"
          {...next(() => setFocus('phoneNumber'))}
        />
      </Card>

      <Card title="İletişim">
        <TextField label="E-posta" value={user?.email ?? ''} editable={false} hint="E-posta adresi buradan değiştirilemez." />
        <FormField
          control={control}
          name="phoneNumber"
          label="Telefon (isteğe bağlı)"
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </Card>

      <Button title="Kaydet" loading={update.isPending} disabled={!formState.isDirty} onPress={onSubmit} />
    </Screen>
  );
}
