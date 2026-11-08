import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField, next, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLogin } from '@/features/auth/hooks';
import { emailSchema } from '@/features/auth/validation';
import { ErrorCode, isApiError } from '@/lib/api';

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.password.required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useLogin();

  const { control, handleSubmit, getValues, setFocus } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  // Başarıda yönlendirme yok: oturum açılınca kök layout'taki guard (app)'e geçer.
  // handleSubmit DOM event tipi bekliyor; RN event'ini geçirmeden çağır.
  const onSubmit = () => handleSubmit((values) => login.mutate(values))();

  const emailNotConfirmed = isApiError(login.error, ErrorCode.EmailNotConfirmed);

  return (
    <Screen scroll contentStyle={styles.content}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Abacasa"
      />
      <View style={styles.header}>
        <Text variant="heading">{t('auth.login.title')}</Text>
        <Text muted>{t('auth.login.subtitle')}</Text>
      </View>

      <FormError messages={login.error?.messages} />
      {emailNotConfirmed && (
        <Button
          title={t('auth.login.resendVerification')}
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
      <FormField
        control={control}
        name="password"
        label={t('common.password')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button
        title={t('auth.login.forgotPassword')}
        variant="ghost"
        style={styles.forgot}
        onPress={() => router.push({ pathname: '/forgot-password', params: { email: getValues('email') } })}
      />

      <Button title={t('auth.login.submit')} loading={login.isPending} onPress={onSubmit} />

      <View style={styles.footer}>
        <Text muted>{t('auth.login.noAccount')}</Text>
        <Button title={t('auth.login.register')} variant="ghost" onPress={() => router.push('/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  header: { gap: Spacing.xs, marginBottom: Spacing.sm },
  forgot: { alignSelf: 'flex-end', minHeight: 36, paddingHorizontal: 0 },
  logo: { width: 180, height: 124, alignSelf: 'center', marginBottom: Spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
