import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField, next, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { AuthLogo } from '@/features/auth/components/AuthLogo';
import { AuthHeader, InfoBanner, TextLink } from '@/features/auth/components/AuthParts';
import { LanguageSelector } from '@/features/auth/components/LanguageSelector';
import { PasswordFormField } from '@/features/auth/components/PasswordFormField';
import { useLogin } from '@/features/auth/hooks';
import { emailSchema } from '@/features/auth/validation';
import { useAcceptInvitation } from '@/features/household/hooks';
import { ErrorCode, isApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.password.required'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Giriş. Davet ekranından gelindiyse (inviteToken) girişten sonra davet otomatik kabul edilir ve
 * davetin hanesine geçilir. Yönlendirme yok: oturum açılınca kök layout'taki guard (app)'e geçer.
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string; inviteToken?: string; household?: string }>();
  const login = useLogin();
  const acceptInvitation = useAcceptInvitation();
  const inviteToken = params.inviteToken || undefined;

  const { control, handleSubmit, getValues, setFocus } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.email ?? '', password: '' },
  });

  // handleSubmit DOM event tipi bekliyor; RN event'ini geçirmeden çağır.
  const onSubmit = () =>
    handleSubmit(async (values) => {
      try {
        await login.mutateAsync(values);
      } catch {
        return; // hata login.error ile gösterilir
      }
      if (!inviteToken) return;
      // Ekran guard ile kapanmış olabilir; promise yine de tamamlanır, sonuç toast ile bildirilir.
      try {
        await acceptInvitation.mutateAsync(inviteToken);
        toast.success(
          params.household ? t('invite.joined', { household: params.household }) : t('invite.joinedGeneric'),
        );
      } catch (error) {
        toast.error(isApiError(error) ? error.messages[0] : t('invite.acceptFailed'));
      }
    })();

  const emailNotConfirmed = isApiError(login.error, ErrorCode.EmailNotConfirmed);
  const busy = login.isPending || acceptInvitation.isPending;

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.topBar}>
        <LanguageSelector />
      </View>

      <View style={styles.logo}>
        <AuthLogo width={112} />
      </View>

      <View style={styles.header}>
        <AuthHeader title={t('authScreens.login.title')} subtitle={t('authScreens.login.subtitle')} />
      </View>

      {inviteToken ? (
        <InfoBanner icon="how-to-reg">
          {params.household
            ? t('authScreens.login.inviteBanner', { household: params.household })
            : t('authScreens.login.inviteBannerGeneric')}
        </InfoBanner>
      ) : null}

      <FormError messages={login.error?.messages} />
      {emailNotConfirmed && (
        <Button
          title={t('authScreens.login.resendVerification')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/verify-email', params: { email: getValues('email') } })}
        />
      )}

      <FormField
        control={control}
        name="email"
        label={t('common.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        {...next(() => setFocus('password'))}
      />
      <PasswordFormField
        control={control}
        name="password"
        label={t('common.password')}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <TextLink
        title={t('authScreens.login.forgotPassword')}
        style={styles.forgot}
        onPress={() => router.push({ pathname: '/forgot-password', params: { email: getValues('email') } })}
      />

      <Button title={t('authScreens.login.submit')} loading={busy} onPress={onSubmit} />

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Text muted>{t('authScreens.login.noAccount')}</Text>
        <TextLink
          title={t('authScreens.login.register')}
          onPress={() =>
            router.push({
              pathname: '/register',
              params: inviteToken
                ? { inviteToken, email: getValues('email') || params.email, household: params.household }
                : {},
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 0, paddingBottom: Spacing.xxl + Spacing.sm },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: -Spacing.md },
  logo: { marginTop: Spacing.md, marginBottom: Spacing.md },
  header: { marginBottom: 6 },
  forgot: { alignSelf: 'flex-end', paddingHorizontal: 0, marginTop: -Spacing.sm },
  spacer: { flexGrow: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
