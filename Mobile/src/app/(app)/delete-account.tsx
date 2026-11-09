import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ConfirmDialog, ErrorState, FormError, Screen, SkeletonList, Text, TextField } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { InfoNote, InlineTextButton } from '@/features/account/components/SettingsKit';
import { useAccountDeletionPreview, useDeleteAccount } from '@/features/account/hooks';
import { mapFieldErrors } from '@/features/account/serverErrors';
import type { AccountHouseholdRef } from '@/features/account/types';
import { useSwitchHousehold } from '@/features/auth/hooks';
import { householdRoutes } from '@/features/household/routes';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

/**
 * Hesabı sil: önizleme (son yönetici olunan haneler engeller; tek üyesi olunan haneler hesapla silinir),
 * şifre onayı ve son bir onay penceresi. Başarıda yerel oturum silinir, guard girişe götürür.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const preview = useAccountDeletionPreview();
  const remove = useDeleteAccount();
  const switchHousehold = useSwitchHousehold();
  const activeTenantId = useAuthStore((s) => s.user?.activeTenant?.id ?? null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [formErrors, setFormErrors] = useState<string[]>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const title = <Stack.Screen options={{ title: t('accountScreen.delete.title') }} />;

  if (preview.isPending) {
    return (
      <View style={styles.container}>
        {title}
        <SkeletonList rows={3} />
      </View>
    );
  }
  if (preview.isError) {
    return (
      <View style={styles.container}>
        {title}
        <ErrorState
          title={t('accountScreen.delete.loadError')}
          message={preview.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void preview.refetch()}
        />
      </View>
    );
  }

  const { blockedHouseholds, householdsToDelete, isLastSuperAdmin } = preview.data;
  const blocked = blockedHouseholds.length > 0 || isLastSuperAdmin;
  const canSubmit = !blocked && password.length > 0;

  /** Engelleyen haneye geç ve üyeler ekranını aç (yönetici atamak için). */
  const goToMembers = (household: AccountHouseholdRef) => {
    if (household.id === activeTenantId) return router.push(householdRoutes.index);
    switchHousehold.mutate(household.id, {
      onSuccess: () => router.push(householdRoutes.index),
      onError: (e) => toast.error(e.message),
    });
  };

  const submit = () => {
    setConfirmOpen(false);
    setFormErrors(undefined);
    setPasswordError(undefined);
    remove.mutate(
      { password, deleteSoleHouseholds: householdsToDelete.length > 0 },
      {
        onSuccess: () => toast.success(t('accountScreen.delete.done')),
        onError: (error) => {
          const { fields, rest } = mapFieldErrors(error.fieldErrors, { Password: 'password' as const });
          setPasswordError(fields[0]?.message);
          setFormErrors(fields.length > 0 ? (rest.length > 0 ? rest : undefined) : error.messages);
          void preview.refetch();
        },
      },
    );
  };

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.content}>
      {title}
      <Text muted style={styles.intro}>
        {t('accountScreen.delete.intro')}
      </Text>

      {blockedHouseholds.length > 0 ? (
        <InfoNote icon="block" tone="danger" title={t('accountScreen.delete.blockedTitle')}>
          <View style={styles.blockedList}>
            {blockedHouseholds.map((h) => (
              <View key={h.id} style={styles.blockedItem}>
                <View style={styles.blockedTexts}>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {h.name}
                  </Text>
                  <Text variant="caption" muted>
                    {t('accountScreen.delete.lastAdmin')}
                  </Text>
                </View>
                <InlineTextButton
                  label={t('accountScreen.delete.goToMembers')}
                  accessibilityLabel={t('accountScreen.delete.goToMembersFor', { name: h.name })}
                  disabled={switchHousehold.isPending}
                  onPress={() => goToMembers(h)}
                />
              </View>
            ))}
          </View>
        </InfoNote>
      ) : null}

      {isLastSuperAdmin ? (
        <InfoNote icon="block" tone="danger" title={t('accountScreen.delete.superAdminTitle')}>
          {t('accountScreen.delete.superAdminMessage')}
        </InfoNote>
      ) : null}

      {householdsToDelete.length > 0 ? (
        <InfoNote icon="warning" tone="warning" title={t('accountScreen.delete.soleTitle')}>
          {t('accountScreen.delete.soleMessage', { names: householdsToDelete.map((h) => h.name).join(', ') })}
        </InfoNote>
      ) : null}

      <FormError messages={formErrors} />
      <TextField
        label={t('accountScreen.delete.passwordLabel')}
        placeholder={t('common.password')}
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        secureTextEntry
        autoComplete="current-password"
        editable={!blocked}
        returnKeyType="go"
        onSubmitEditing={() => canSubmit && setConfirmOpen(true)}
      />
      <View style={styles.spacer} />
      <Button
        title={t('accountScreen.delete.submit')}
        variant="destructive"
        disabled={!canSubmit}
        loading={remove.isPending}
        onPress={() => setConfirmOpen(true)}
      />
      {blocked ? (
        <Text variant="caption" color={colors.textMuted} style={styles.center}>
          {t('accountScreen.delete.blockedHint')}
        </Text>
      ) : null}

      <ConfirmDialog
        visible={confirmOpen}
        title={t('accountScreen.delete.confirmTitle')}
        message={t('accountScreen.delete.confirmMessage')}
        confirmLabel={t('accountScreen.delete.confirm')}
        destructive
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 20, paddingTop: Spacing.xs, gap: 14 },
  intro: { fontSize: 15, lineHeight: 22 },
  blockedList: { gap: Spacing.sm },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: c.card,
    borderRadius: Radius.sm + 2,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  blockedTexts: { flex: 1, gap: 2 },
  spacer: { flex: 1 },
  center: { textAlign: 'center' },
}));
