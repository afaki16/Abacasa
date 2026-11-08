import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, Screen, SwitchCard, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRegister } from '@/features/auth/hooks';
import { openLegalDocument } from '@/features/auth/legal';
import {
  emailSchema,
  nameSchema,
  PASSWORD_HINT_KEY,
  passwordSchema,
  phoneSchema,
  toNullable,
} from '@/features/auth/validation';

const schema = z
  .object({
    firstName: nameSchema('firstName'),
    lastName: nameSchema('lastName'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    householdName: z.string().trim().min(1, 'validation.householdName.required').max(100, 'validation.householdName.max'),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Backend de zorunlu tutar (RegisterCommandValidator); onaylar ConsentRecord'a yazılır.
    acceptTerms: z.boolean().refine((v) => v, 'validation.acceptTerms'),
    acknowledgePrivacy: z.boolean().refine((v) => v, 'validation.acknowledgePrivacy'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.password.mismatch',
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { t } = useTranslation();
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
        <Text variant="heading">{t('auth.register.title')}</Text>
        <Text muted>{t('auth.register.subtitle')}</Text>
      </View>

      <FormError messages={register.error?.messages} />

      <Card title={t('common.personalInfo')}>
        <FormField
          control={control}
          name="firstName"
          label={t('common.firstName')}
          autoComplete="given-name"
          textContentType="givenName"
          {...next(() => setFocus('lastName'))}
        />
        <FormField
          control={control}
          name="lastName"
          label={t('common.lastName')}
          autoComplete="family-name"
          textContentType="familyName"
          {...next(() => setFocus('email'))}
        />
      </Card>

      <Card title={t('common.contact')}>
        <FormField
          control={control}
          name="email"
          label={t('common.email')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          {...next(() => setFocus('phoneNumber'))}
        />
        <FormField
          control={control}
          name="phoneNumber"
          label={t('common.phoneOptional')}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          {...next(() => setFocus('householdName'))}
        />
      </Card>

      <Card title={t('auth.register.householdSection')} description={t('auth.register.householdDescription')}>
        <FormField
          control={control}
          name="householdName"
          label={t('auth.register.householdName')}
          placeholder={t('auth.register.householdPlaceholder')}
          {...next(() => setFocus('password'))}
        />
      </Card>

      <Card title={t('auth.register.securitySection')}>
        <FormField
          control={control}
          name="password"
          label={t('common.password')}
          hint={t(PASSWORD_HINT_KEY)}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          {...next(() => setFocus('confirmPassword'))}
        />
        <FormField
          control={control}
          name="confirmPassword"
          label={t('auth.register.passwordConfirm')}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
      </Card>

      <Card title={t('auth.register.consentsSection')}>
        <Button title={t('auth.register.readTerms')} variant="ghost" onPress={() => openLegalDocument('Terms')} />
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <SwitchCard title={t('auth.register.acceptTerms')} value={field.value} onChange={field.onChange} />
          )}
        />
        <Button title={t('auth.register.readPrivacy')} variant="ghost" onPress={() => openLegalDocument('PrivacyNotice')} />
        <Controller
          control={control}
          name="acknowledgePrivacy"
          render={({ field }) => (
            <SwitchCard
              title={t('auth.register.acknowledgePrivacy')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FormError messages={consentErrors} />
      </Card>

      <Button title={t('auth.register.submit')} loading={register.isPending} onPress={onSubmit} />

      <View style={styles.footer}>
        <Text muted>{t('auth.register.haveAccount')}</Text>
        <Button title={t('auth.register.login')} variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
