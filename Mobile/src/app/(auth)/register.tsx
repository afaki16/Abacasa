import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, Screen, SwitchCard, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRegister } from '@/features/auth/hooks';
import { openLegalDocument } from '@/features/auth/legal';
import {
  emailSchema,
  nameSchema,
  PASSWORD_HINT,
  passwordSchema,
  phoneSchema,
  toNullable,
} from '@/features/auth/validation';

const schema = z
  .object({
    firstName: nameSchema('Ad'),
    lastName: nameSchema('Soyad'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    householdName: z.string().trim().min(1, 'Hane adı gerekli').max(100, 'Hane adı en fazla 100 karakter olabilir'),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Backend de zorunlu tutar (RegisterCommandValidator); onaylar ConsentRecord'a yazılır.
    acceptTerms: z.boolean().refine((v) => v, 'Kullanım koşullarını kabul etmelisin'),
    acknowledgePrivacy: z.boolean().refine((v) => v, 'Aydınlatma metnini okuduğunu onaylamalısın'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Şifreler eşleşmiyor',
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const register = useRegister();

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      householdName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acknowledgePrivacy: false,
    },
  });

  const consentErrors = [errors.acceptTerms?.message, errors.acknowledgePrivacy?.message].filter(
    (m): m is string => !!m,
  );

  const onSubmit = () =>
    handleSubmit((values) =>
      register.mutate(
        { ...values, phoneNumber: toNullable(values.phoneNumber) },
        // Hesap doğrulanana kadar giriş yok: "e-postanı kontrol et" ekranına geç (geri dönülmesin).
        { onSuccess: () => router.replace({ pathname: '/verify-email', params: { email: values.email, sent: '1' } }) },
      ),
    )();

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="heading">Kayıt ol</Text>
        <Text muted>Birkaç bilgiyle hesabını oluştur.</Text>
      </View>

      <FormError messages={register.error?.messages} />

      <Card title="Kişisel bilgiler">
        <FormField
          control={control}
          name="firstName"
          label="Ad"
          autoComplete="given-name"
          textContentType="givenName"
          {...next(() => setFocus('lastName'))}
        />
        <FormField
          control={control}
          name="lastName"
          label="Soyad"
          autoComplete="family-name"
          textContentType="familyName"
          {...next(() => setFocus('email'))}
        />
      </Card>

      <Card title="İletişim">
        <FormField
          control={control}
          name="email"
          label="E-posta"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          {...next(() => setFocus('phoneNumber'))}
        />
        <FormField
          control={control}
          name="phoneNumber"
          label="Telefon (isteğe bağlı)"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          {...next(() => setFocus('householdName'))}
        />
      </Card>

      <Card title="Hane" description="Bütçeni tutacağın hane. E-postanı doğrulayınca açılır; sonra aile üyelerini davet edebilirsin.">
        <FormField
          control={control}
          name="householdName"
          label="Hane adı"
          placeholder="Örn. Yılmaz Hanesi"
          {...next(() => setFocus('password'))}
        />
      </Card>

      <Card title="Hesap güvenliği">
        <FormField
          control={control}
          name="password"
          label="Şifre"
          hint={PASSWORD_HINT}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          {...next(() => setFocus('confirmPassword'))}
        />
        <FormField
          control={control}
          name="confirmPassword"
          label="Şifre (tekrar)"
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
      </Card>

      <Card title="Onaylar">
        <Button title="Kullanım koşullarını oku" variant="ghost" onPress={() => openLegalDocument('Terms')} />
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <SwitchCard title="Kullanım koşullarını okudum ve kabul ediyorum" value={field.value} onChange={field.onChange} />
          )}
        />
        <Button title="Aydınlatma metnini oku" variant="ghost" onPress={() => openLegalDocument('PrivacyNotice')} />
        <Controller
          control={control}
          name="acknowledgePrivacy"
          render={({ field }) => (
            <SwitchCard
              title="Kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FormError messages={consentErrors} />
      </Card>

      <Button title="Hesap oluştur" loading={register.isPending} onPress={onSubmit} />

      <View style={styles.footer}>
        <Text muted>Zaten hesabın var mı?</Text>
        <Button title="Giriş yap" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
