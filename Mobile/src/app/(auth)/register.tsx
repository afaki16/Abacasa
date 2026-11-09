import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, FormError, FormField, next, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { InfoBanner, LinkedCheckbox, TextLink } from '@/features/auth/components/AuthParts';
import { PasswordFormField } from '@/features/auth/components/PasswordFormField';
import { useLogin, useRegister } from '@/features/auth/hooks';
import { openLegalDocument } from '@/features/auth/legal';
import { INLINE_MARKER } from '@/features/auth/passwordRules';
import { makeRegisterSchema, toRegisterRequest, type RegisterFormValues } from '@/features/auth/registerForm';
import { toast } from '@/stores/toastStore';

/**
 * Kayıt. Davetsiz kayıtta hane adı istenir; hesap e-posta doğrulanınca açılır ("e-postanı kontrol et").
 * Davetle kayıtta (inviteToken; davet ekranından) hane adı sorulmaz, e-posta davetteki adrestir ve
 * backend e-postayı doğrulanmış sayıp daveti kabul eder — bu yüzden kayıttan sonra doğrudan giriş yapılır.
 */
export default function RegisterScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ inviteToken?: string; email?: string; household?: string }>();
  const inviteToken = params.inviteToken || undefined;
  const register = useRegister();
  const login = useLogin();
  const schema = useMemo(() => makeRegisterSchema(!!inviteToken), [inviteToken]);

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: params.email ?? '',
      householdName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acknowledgePrivacy: false,
    },
  });

  const [acceptTerms, acknowledgePrivacy] = useWatch({ control, name: ['acceptTerms', 'acknowledgePrivacy'] });
  const consentErrors = [errors.acceptTerms?.message, errors.acknowledgePrivacy?.message].filter(
    (m): m is string => !!m,
  );

  const onSubmit = () =>
    handleSubmit(async (values) => {
      try {
        await register.mutateAsync(toRegisterRequest(values, inviteToken));
      } catch {
        return; // hata register.error ile gösterilir
      }
      if (!inviteToken) {
        // Hesap doğrulanana kadar giriş yok: "e-postanı kontrol et" ekranına geç (geri dönülmesin).
        router.replace({ pathname: '/verify-email', params: { email: values.email, sent: '1' } });
        return;
      }
      // Davetli hesap aktif ve haneye üye: yeni şifreyle giriş; guard uygulamaya geçer
      // (ekran kapanır, bu yüzden mutate geri çağrısı değil await + toast).
      try {
        await login.mutateAsync({ email: values.email, password: values.password });
        toast.success(t('authScreens.register.joined'));
      } catch {
        toast.info(t('authScreens.register.loginAfterInvite'));
        router.replace({ pathname: '/login', params: { email: values.email } });
      }
    })();

  const goToLogin = () => {
    if (inviteToken) {
      router.replace({
        pathname: '/login',
        params: { inviteToken, email: params.email, household: params.household },
      });
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.content}>
      {inviteToken ? (
        <InfoBanner icon="how-to-reg">
          {params.household
            ? t('authScreens.register.inviteBanner', { household: params.household })
            : t('authScreens.register.inviteBannerGeneric')}
        </InfoBanner>
      ) : null}

      <FormError messages={register.error?.messages ?? login.error?.messages} />

      <View style={styles.row}>
        <View style={styles.half}>
          <FormField
            control={control}
            name="firstName"
            label={t('common.firstName')}
            autoComplete="given-name"
            textContentType="givenName"
            {...next(() => setFocus('lastName'))}
          />
        </View>
        <View style={styles.half}>
          <FormField
            control={control}
            name="lastName"
            label={t('common.lastName')}
            autoComplete="family-name"
            textContentType="familyName"
            {...next(() => setFocus(inviteToken && params.email ? 'password' : 'email'))}
          />
        </View>
      </View>

      <FormField
        control={control}
        name="email"
        label={t('authScreens.register.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        // Davetle kayıtta e-posta davetteki adres olmalı (backend eşleştirir).
        editable={!(inviteToken && params.email)}
        {...next(() => setFocus('password'))}
      />

      <PasswordFormField
        control={control}
        name="password"
        label={t('authScreens.register.password')}
        rules="compact"
        autoComplete="new-password"
        textContentType="newPassword"
        {...next(() => setFocus('confirmPassword'))}
      />

      <PasswordFormField
        control={control}
        name="confirmPassword"
        label={t('authScreens.register.passwordConfirm')}
        placeholder={t('authScreens.register.passwordConfirmPlaceholder')}
        autoComplete="new-password"
        textContentType="newPassword"
        {...(inviteToken
          ? { returnKeyType: 'done' as const }
          : next(() => setFocus('householdName')))}
      />

      {!inviteToken ? (
        <FormField
          control={control}
          name="householdName"
          label={t('authScreens.register.householdName')}
          placeholder={t('authScreens.register.householdPlaceholder')}
          returnKeyType="done"
        />
      ) : null}

      <View>
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <LinkedCheckbox
              checked={field.value}
              onChange={field.onChange}
              template={t('authScreens.register.terms', { link: INLINE_MARKER })}
              linkLabel={t('authScreens.register.termsLink')}
              onLinkPress={() => void openLegalDocument('Terms')}
              error={!!fieldState.error}
            />
          )}
        />
        <Controller
          control={control}
          name="acknowledgePrivacy"
          render={({ field, fieldState }) => (
            <LinkedCheckbox
              checked={field.value}
              onChange={field.onChange}
              template={t('authScreens.register.privacy', { link: INLINE_MARKER })}
              linkLabel={t('authScreens.register.privacyLink')}
              onLinkPress={() => void openLegalDocument('PrivacyNotice')}
              error={!!fieldState.error}
            />
          )}
        />
        <FormError messages={consentErrors} />
      </View>

      <View style={styles.spacer} />

      <Button
        title={t('authScreens.register.submit')}
        // İki onay da işaretlenmeden düğme kapalı (tasarım); diğer alanlar gönderimde doğrulanır.
        disabled={!acceptTerms || !acknowledgePrivacy}
        loading={register.isPending || login.isPending}
        onPress={onSubmit}
      />

      <View style={styles.footer}>
        <Text muted>{t('authScreens.register.haveAccount')}</Text>
        <TextLink title={t('authScreens.register.login')} onPress={goToLogin} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.xl - 4, paddingTop: Spacing.xs, gap: Spacing.md },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, minWidth: 0 },
  spacer: { flexGrow: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
