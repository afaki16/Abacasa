import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, ConfirmDialog, Switch } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { SectionLabel, SettingsGroup, SettingsRow } from '@/features/account/components/SettingsKit';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { DeleteHouseholdDialog } from '@/features/household/components/DeleteHouseholdDialog';
import { HOUSEHOLD_PERMISSIONS } from '@/features/household/constants';
import {
  useHousehold,
  useHouseholdMembers,
  useLeaveHousehold,
  useUpdateHouseholdModules,
} from '@/features/household/hooks';
import { leaveBlockReason } from '@/features/household/memberView';
import { HOUSEHOLD_ENDPOINTS } from '@/features/household/api';
import { useFileDownload } from '@/lib/files/useFileDownload';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

/**
 * Hane ayarları: ek modüller (bağış hedefleri ve emanetler), Excel dışa aktarım, haneden ayrıl, haneyi sil.
 * Modül ve dışa aktarım Household.Update, silme Household.Delete ister (yönetici). Ayrılma izin istemez.
 */
export default function HouseholdSettingsScreen() {
  return (
    <RequirePermission permission={HOUSEHOLD_PERMISSIONS.READ}>
      <HouseholdSettings />
    </RequirePermission>
  );
}

function HouseholdSettings() {
  const { t } = useTranslation();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const canUpdate = useHasPermission(HOUSEHOLD_PERMISSIONS.UPDATE);
  const download = useFileDownload();
  const canDelete = useHasPermission(HOUSEHOLD_PERMISSIONS.DELETE);
  const donationExtras = useAuthStore((s) => s.user?.activeTenant?.modules.donationExtras ?? false);
  const activeName = useAuthStore((s) => s.user?.activeTenant?.name ?? '');
  const household = useHousehold();
  const members = useHouseholdMembers();
  const modules = useUpdateHouseholdModules();
  const leave = useLeaveHousehold();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Kayıt sürerken anahtar istenen değerde dursun (sunucu yanıtı /me'yi tazeleyince kalıcı olur).
  const extrasValue = modules.isPending && modules.variables ? modules.variables.donationExtras : donationExtras;
  const toggleExtras = (value: boolean) =>
    modules.mutate(
      { donationExtras: value },
      {
        onSuccess: () => toast.success(value ? t('householdScreen.modules.enabled') : t('householdScreen.modules.disabled')),
        onError: (e) => toast.error(e.message),
      },
    );

  const block = members.data ? leaveBlockReason(members.data) : null;
  const leaveSubtitle =
    block === 'lastAdmin'
      ? t('householdScreen.leave.lastAdmin')
      : block === 'soleMember'
        ? t('householdScreen.leave.soleMember')
        : undefined;

  const confirmLeave = () =>
    leave.mutate(undefined, {
      onSuccess: () => {
        setLeaveOpen(false);
        toast.success(t('householdScreen.leave.done'));
        router.dismissAll();
      },
      onError: (e) => {
        setLeaveOpen(false);
        toast.error(e.message);
      },
    });

  const name = household.data?.name ?? activeName;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('householdScreen.settingsTitle') }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {canUpdate ? (
          <>
            <SectionLabel label={t('householdScreen.modules.section')} first />
            <SettingsGroup>
              <SettingsRow
                first
                title={t('householdScreen.modules.donationExtras')}
                subtitle={t('householdScreen.modules.donationExtrasDescription')}
                trailing={
                  <Switch
                    value={extrasValue}
                    onValueChange={toggleExtras}
                    disabled={modules.isPending}
                    accessibilityLabel={t('householdScreen.modules.donationExtras')}
                  />
                }
              />
            </SettingsGroup>

            <SectionLabel label={t('householdScreen.data.section')} />
            <SettingsGroup>
              <SettingsRow
                first
                icon="download"
                iconTone="primary"
                disabled={download.isPending}
                title={t('householdScreen.data.export')}
                subtitle={t('householdScreen.data.exportHint')}
                onPress={() =>
                  download.mutate({
                    url: HOUSEHOLD_ENDPOINTS.EXPORT,
                    fallbackName: 'abacasa-hane.xlsx',
                    dialogTitle: t('householdScreen.data.export'),
                  })
                }
              />
            </SettingsGroup>
          </>
        ) : null}

        <SectionLabel label={t('householdScreen.danger.section')} first={!canUpdate} />
        <SettingsGroup>
          <SettingsRow
            first
            icon="logout"
            destructive
            disabled={!!block || members.isPending}
            title={t('householdScreen.leave.action')}
            subtitle={leaveSubtitle}
            trailing={<View />}
            onPress={() => setLeaveOpen(true)}
          />
          {canDelete ? (
            <SettingsRow
              icon="delete-forever"
              destructive
              title={t('householdScreen.delete.action')}
              trailing={<Badge label={t('householdScreen.delete.adminOnly')} variant="admin" style={styles.badge} />}
              onPress={() => setDeleteOpen(true)}
            />
          ) : null}
        </SettingsGroup>
      </ScrollView>

      <ConfirmDialog
        visible={leaveOpen}
        title={t('householdScreen.leave.title')}
        message={t('householdScreen.leave.message')}
        confirmLabel={t('householdScreen.leave.confirm')}
        destructive
        loading={leave.isPending}
        onConfirm={confirmLeave}
        onCancel={() => setLeaveOpen(false)}
      />
      <DeleteHouseholdDialog
        visible={deleteOpen}
        householdName={name}
        memberCount={household.data?.memberCount ?? members.data?.length ?? 1}
        onCancel={() => setDeleteOpen(false)}
        onDeleted={() => {
          setDeleteOpen(false);
          toast.success(t('householdScreen.delete.done', { name }));
          router.dismissAll();
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },
  badge: { alignSelf: 'center' },
}));
