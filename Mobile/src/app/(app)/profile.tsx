import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, ConfirmDialog, FormError, FormField, next, Screen } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { ProfilePhotoEditor } from '@/features/account/components/ProfilePhotoEditor';
import { ReadOnlyActionField } from '@/features/account/components/ReadOnlyActionField';
import { HeaderTextAction, SettingsGroup, SettingsRow } from '@/features/account/components/SettingsKit';
import { accountRoutes } from '@/features/account/routes';
import { mapFieldErrors } from '@/features/account/serverErrors';
import { useLogout, useUpdateProfile } from '@/features/auth/hooks';
import { nameSchema, phoneSchema, toNullable } from '@/features/auth/validation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

const schema = z.object({
  firstName: nameSchema('firstName'),
  lastName: nameSchema('lastName'),
  phoneNumber: phoneSchema,
});

type FormValues = z.infer<typeof schema>;

const SERVER_FIELDS = { FirstName: 'firstName', LastName: 'lastName', PhoneNumber: 'phoneNumber' } as const;

/**
 * Profil: fotoğraf / baş harfler, ad, soyad, e-posta (doğrulamalı değişiklik ayrı ekranda), telefon; üst barda Kaydet.
 * Altında hesap işlemleri (şifre, oturumlar, verilerimi indir, hesabı sil) ve çıkış. Dil/tema Ayarlar'da (/settings).
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const logout = useLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>();

  const { control, handleSubmit, formState, setFocus, setError, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  });

  const save = () =>
    handleSubmit((values) => {
      setFormErrors(undefined);
      update.mutate(
        { firstName: values.firstName, lastName: values.lastName, phoneNumber: toNullable(values.phoneNumber) },
        {
          onSuccess: () => {
            const fresh = useAuthStore.getState().user;
            reset({
              firstName: fresh?.firstName ?? values.firstName,
              lastName: fresh?.lastName ?? values.lastName,
              phoneNumber: fresh?.phoneNumber ?? '',
            });
            toast.success(t('profileScreen.saved'));
          },
          onError: (error) => {
            const { fields, rest } = mapFieldErrors<keyof FormValues>(error.fieldErrors, SERVER_FIELDS);
            fields.forEach((f) => setError(f.name, { message: f.message }));
            setFormErrors(fields.length > 0 ? (rest.length > 0 ? rest : undefined) : error.messages);
          },
        },
      );
    })();

  const canSave = formState.isDirty && !update.isPending;

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.content}>
      <Stack.Screen
        options={{
          title: t('profileScreen.title'),
          headerRight: () => <HeaderTextAction label={t('common.save')} disabled={!canSave} onPress={save} />,
        }}
      />

      <View style={styles.avatar}>
        <ProfilePhotoEditor firstName={user?.firstName} lastName={user?.lastName} profileImageUrl={user?.profileImageUrl} />
      </View>

      <FormError messages={formErrors} />
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
      <ReadOnlyActionField
        label={t('common.email')}
        value={user?.email ?? ''}
        actionLabel={t('profileScreen.changeEmail')}
        onAction={() => router.push(accountRoutes.changeEmail)}
      />
      <FormField
        control={control}
        name="phoneNumber"
        label={t('common.phone')}
        keyboardType="phone-pad"
        autoComplete="tel"
        returnKeyType="go"
        onSubmitEditing={save}
      />

      <SettingsGroup>
        <SettingsRow first icon="lock" title={t('profileScreen.changePassword')} onPress={() => router.push(accountRoutes.changePassword)} />
        <SettingsRow icon="devices" title={t('profileScreen.sessions')} onPress={() => router.push(accountRoutes.sessions)} />
        <SettingsRow icon="download" title={t('profileScreen.exportData')} onPress={() => router.push(accountRoutes.exportData)} />
        <SettingsRow
          icon="person-remove"
          destructive
          title={t('profileScreen.deleteAccount')}
          onPress={() => router.push(accountRoutes.deleteAccount)}
        />
      </SettingsGroup>

      <Button title={t('common.logout')} variant="danger" onPress={() => setLogoutOpen(true)} />

      <ConfirmDialog
        visible={logoutOpen}
        title={t('common.logout')}
        message={t('profileScreen.logoutMessage')}
        confirmLabel={t('common.logout')}
        destructive
        loading={logout.isPending}
        onConfirm={() => logout.mutate()}
        onCancel={() => setLogoutOpen(false)}
      />
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.md },
  avatar: { alignItems: 'center', paddingVertical: 6 },
}));
