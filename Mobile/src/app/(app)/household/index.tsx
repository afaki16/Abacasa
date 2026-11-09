import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ConfirmDialog, EmptyState, ErrorState, Skeleton, SkeletonList, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { HeaderTextAction, SectionLabel, SettingsGroup } from '@/features/account/components/SettingsKit';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { HouseholdHeaderCard } from '@/features/household/components/HouseholdHeaderCard';
import { InvitationRow } from '@/features/household/components/InvitationRow';
import { InviteSheet } from '@/features/household/components/InviteSheet';
import { MemberActionsSheet } from '@/features/household/components/MemberActionsSheet';
import { MemberRow } from '@/features/household/components/MemberRow';
import { RenameHouseholdSheet } from '@/features/household/components/RenameHouseholdSheet';
import { HOUSEHOLD_MEMBER_PERMISSIONS, HOUSEHOLD_PERMISSIONS } from '@/features/household/constants';
import {
  useHousehold,
  useHouseholdInvitations,
  useHouseholdMembers,
  useResendHouseholdInvitation,
  useRevokeHouseholdInvitation,
} from '@/features/household/hooks';
import { pendingInvitationCount, sortMembers, visibleInvitations } from '@/features/household/memberView';
import { householdRoutes } from '@/features/household/routes';
import type { HouseholdInvitation, HouseholdMember } from '@/features/household/types';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

/** Hane ve üyeler: hane adı, üyeler (rol, bağlı kişi), bekleyen davetler, davet gönder. */
export default function HouseholdScreen() {
  return (
    <RequirePermission permission={HOUSEHOLD_PERMISSIONS.READ}>
      <Household />
    </RequirePermission>
  );
}

function Household() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const hasHousehold = useAuthStore((s) => !!s.user?.activeTenant);
  const canRename = useHasPermission(HOUSEHOLD_PERMISSIONS.UPDATE);
  const canReadMembers = useHasPermission(HOUSEHOLD_MEMBER_PERMISSIONS.READ);
  const canInvite = useHasPermission(HOUSEHOLD_MEMBER_PERMISSIONS.CREATE);
  const canUpdateMember = useHasPermission(HOUSEHOLD_MEMBER_PERMISSIONS.UPDATE);
  const canDeleteMember = useHasPermission(HOUSEHOLD_MEMBER_PERMISSIONS.DELETE);

  const household = useHousehold();
  const members = useHouseholdMembers();
  const invitations = useHouseholdInvitations();
  const resend = useResendHouseholdInvitation();
  const revoke = useRevokeHouseholdInvitation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [selected, setSelected] = useState<HouseholdMember | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<HouseholdInvitation | null>(null);

  const header = (
    <Stack.Screen
      options={{
        title: t('householdScreen.title'),
        headerRight: () => (
          <HeaderTextAction label={t('householdScreen.settingsAction')} onPress={() => router.push(householdRoutes.settings)} />
        ),
      }}
    />
  );

  if (!hasHousehold) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('householdScreen.title') }} />
        <EmptyState icon="home" title={t('household.noHouseholdTitle')} message={t('household.noHouseholdMessage')} />
      </View>
    );
  }

  const loading = household.isPending || (canReadMembers && members.isPending);
  const failed = household.isError || (canReadMembers && members.isError);
  const refetch = () => {
    void household.refetch();
    if (canReadMembers) {
      void members.refetch();
      void invitations.refetch();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.skeleton}>
          <Skeleton height={78} radius={Radius.lg} />
        </View>
        <SkeletonList rows={4} />
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.container}>
        {header}
        <ErrorState
          title={t('householdScreen.loadError')}
          message={(household.error ?? members.error)?.message}
          actionLabel={t('common.retry')}
          onAction={refetch}
        />
      </View>
    );
  }

  const detail = household.data;
  if (!detail) return null;
  const memberList = sortMembers(members.data ?? []);
  const invitationList = visibleInvitations(invitations.data ?? []);
  const me = memberList.find((m) => m.isCurrentUser);
  const openMember = (m: HouseholdMember) => {
    setSelected(m);
    setSheetOpen(true);
  };
  const memberPress = (m: HouseholdMember) =>
    m.isCurrentUser || canUpdateMember || canDeleteMember ? () => openMember(m) : undefined;

  const doResend = (inv: HouseholdInvitation) =>
    resend.mutate(inv.id, {
      onSuccess: (r) =>
        toast.success(r.emailSent ? t('invitations.resent', { email: r.email }) : t('invitations.sentWithoutEmail', { email: r.email })),
      onError: (e) => toast.error(e.message),
    });

  const doRevoke = () => {
    if (!revokeTarget) return;
    revoke.mutate(revokeTarget.id, {
      onSuccess: () => {
        toast.success(t('invitations.revoked', { email: revokeTarget.email }));
        setRevokeTarget(null);
      },
      onError: (e) => {
        toast.error(e.message);
        setRevokeTarget(null);
      },
    });
  };

  return (
    <View style={styles.container}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={household.isRefetching || members.isRefetching || invitations.isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            onRefresh={refetch}
          />
        }
      >
        <HouseholdHeaderCard
          name={detail.name}
          memberCount={detail.memberCount}
          pendingInvitations={pendingInvitationCount(invitations.data ?? [])}
          onRename={canRename ? () => setRenameOpen(true) : undefined}
        />

        {canReadMembers ? (
          <>
            <SectionLabel label={t('members.section')} />
            <SettingsGroup>
              {memberList.map((m, i) => (
                <MemberRow key={m.membershipId} member={m} first={i === 0} onPress={memberPress(m)} />
              ))}
            </SettingsGroup>
            {me?.role === 'Admin' && memberList.filter((m) => m.role === 'Admin').length === 1 && memberList.length > 1 ? (
              <Text variant="caption" muted style={styles.note}>
                {t('members.lastAdminNote')}
              </Text>
            ) : null}

            {invitationList.length > 0 ? (
              <>
                <SectionLabel label={t('invitations.section')} />
                <SettingsGroup>
                  {invitationList.map((inv, i) => (
                    <InvitationRow
                      key={inv.id}
                      invitation={inv}
                      first={i === 0}
                      busy={(resend.isPending && resend.variables === inv.id) || (revoke.isPending && revoke.variables === inv.id)}
                      onResend={canInvite ? () => doResend(inv) : undefined}
                      onRevoke={canDeleteMember ? () => setRevokeTarget(inv) : undefined}
                    />
                  ))}
                </SettingsGroup>
              </>
            ) : invitations.isError ? (
              <Text variant="caption" color={colors.danger} style={styles.note}>
                {t('invitations.loadError')}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {canInvite ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
          <Button title={t('invitations.open')} icon="person-add" onPress={() => setInviteOpen(true)} />
        </View>
      ) : null}

      <InviteSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} />
      <RenameHouseholdSheet visible={renameOpen} currentName={detail.name} onClose={() => setRenameOpen(false)} />
      <MemberActionsSheet
        visible={sheetOpen}
        member={selected}
        members={memberList}
        canUpdate={canUpdateMember}
        canDelete={canDeleteMember}
        onClose={() => setSheetOpen(false)}
      />
      <ConfirmDialog
        visible={!!revokeTarget}
        title={t('invitations.revokeTitle')}
        message={revokeTarget ? t('invitations.revokeMessage', { email: revokeTarget.email }) : undefined}
        confirmLabel={t('invitations.revoke')}
        destructive
        loading={revoke.isPending}
        onConfirm={doRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xl, gap: Spacing.sm },
  skeleton: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  note: { paddingHorizontal: Spacing.xs },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: 10, backgroundColor: c.background },
}));
