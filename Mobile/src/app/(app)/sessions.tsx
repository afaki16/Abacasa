import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ConfirmDialog, EmptyState, ErrorState, SkeletonList } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { SessionRow } from '@/features/account/components/SessionRow';
import { SectionLabel, SettingsGroup } from '@/features/account/components/SettingsKit';
import { useRevokeOtherSessions, useSessionOverview } from '@/features/account/hooks';
import type { SessionRowModel } from '@/features/account/sessionsView';
import { useRevokeSession } from '@/features/auth/hooks';
import { plural } from '@/lib/i18n';
import { toast } from '@/stores/toastStore';

/** Oturumlar: aktif cihazlar ("Bu cihaz" üstte), tek tek ya da hepsini kapat, kapanmış oturum geçmişi. */
export default function SessionsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const overview = useSessionOverview();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const [target, setTarget] = useState<SessionRowModel | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);
  // Göreli zamanlar verinin alındığı ana göre (render saf kalsın).
  const now = overview.dataUpdatedAt;

  const title = <Stack.Screen options={{ title: t('sessionsScreen.title') }} />;

  if (overview.isPending) {
    return (
      <View style={styles.container}>
        {title}
        <SkeletonList rows={4} />
      </View>
    );
  }

  if (overview.isError) {
    return (
      <View style={styles.container}>
        {title}
        <ErrorState
          title={t('sessionsScreen.loadError')}
          message={overview.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void overview.refetch()}
        />
      </View>
    );
  }

  const { active, history } = overview.data;
  const others = active.filter((s) => !s.isThisDevice);

  const confirmRevoke = () => {
    if (!target) return;
    const device = target.name ?? t('sessionsScreen.unknownDevice');
    revoke.mutate(target.id, {
      onSuccess: () => toast.success(t('sessionsScreen.revokedToast', { device })),
      onError: (e) => toast.error(e.message),
      onSettled: () => setTarget(null),
    });
  };

  const confirmOthers = () =>
    revokeOthers.mutate(
      others.map((s) => s.id),
      {
        onSuccess: () => toast.success(t('sessionsScreen.othersRevoked')),
        onError: (e) => toast.error(e.message),
        onSettled: () => setOthersOpen(false),
      },
    );

  return (
    <View style={styles.container}>
      {title}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={overview.isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            onRefresh={() => void overview.refetch()}
          />
        }
      >
        {active.length === 0 ? (
          <EmptyState icon="devices" title={t('sessionsScreen.emptyTitle')} message={t('sessionsScreen.emptyMessage')} />
        ) : (
          <>
            <SectionLabel label={plural('sessionsScreen.activeSection', active.length)} first />
            <SettingsGroup>
              {active.map((s, i) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  now={now}
                  first={i === 0}
                  busy={(revoke.isPending && revoke.variables === s.id) || revokeOthers.isPending}
                  onRevoke={s.isThisDevice ? undefined : () => setTarget(s)}
                />
              ))}
            </SettingsGroup>
            {others.length > 0 ? (
              <Button
                title={t('sessionsScreen.revokeOthers')}
                variant="danger"
                size="sm"
                loading={revokeOthers.isPending}
                onPress={() => setOthersOpen(true)}
                style={styles.othersButton}
              />
            ) : null}
          </>
        )}

        {history.length > 0 ? (
          <>
            <SectionLabel label={t('sessionsScreen.historySection')} />
            <SettingsGroup>
              {history.map((s, i) => (
                <SessionRow key={s.id} session={s} now={now} first={i === 0} />
              ))}
            </SettingsGroup>
          </>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={!!target}
        title={t('sessionsScreen.revokeTitle')}
        message={
          target ? t('sessionsScreen.revokeMessage', { device: target.name ?? t('sessionsScreen.unknownDevice') }) : undefined
        }
        confirmLabel={t('sessionsScreen.revoke')}
        destructive
        loading={revoke.isPending}
        onConfirm={confirmRevoke}
        onCancel={() => setTarget(null)}
      />
      <ConfirmDialog
        visible={othersOpen}
        title={t('sessionsScreen.revokeOthers')}
        message={plural('sessionsScreen.revokeOthersMessage', others.length)}
        confirmLabel={t('sessionsScreen.revokeOthersConfirm')}
        destructive
        loading={revokeOthers.isPending}
        onConfirm={confirmOthers}
        onCancel={() => setOthersOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },
  othersButton: { borderWidth: 1, borderColor: c.dangerSurface, marginVertical: Spacing.xs },
}));
