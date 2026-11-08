import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, RefreshControl, View } from 'react-native';

import { Button, Card, FormError, ListItem, Screen, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { useLogoutAll, useRevokeSession, useSessions, type SessionItem } from '@/features/auth/hooks';
import { formatDisplayDate } from '@/lib/format/period';

const pad = (n: number) => String(n).padStart(2, '0');

/** Tarih-saat (cihazın saat diliminde): "dd.MM.yyyy HH:mm". Tarih kısmı ortak biçimleyiciden. */
function formatDateTime(value: string) {
  const d = new Date(value);
  const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${formatDisplayDate(localDate)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function describe(session: SessionItem, t: TFunction) {
  const parts = [t('sessions.signedIn', { date: formatDateTime(session.createdDate) })];
  if (session.ipAddress) parts.push(session.ipAddress);
  return parts.join(' · ');
}

/** Hesabın açık olduğu cihazlar. Tek oturum ya da hepsi kapatılabilir. */
export default function SessionsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const logoutAll = useLogoutAll();

  const confirmRevoke = (session: SessionItem) =>
    Alert.alert(
      t('sessions.revokeTitle'),
      t('sessions.revokeMessage', { device: session.deviceName || t('sessions.thisDevice') }),
      [
        { text: t('common.dismiss'), style: 'cancel' },
        { text: t('sessions.revoke'), style: 'destructive', onPress: () => revoke.mutate(session.id) },
      ],
    );

  const confirmLogoutAll = () =>
    Alert.alert(t('sessions.logoutAll'), t('sessions.logoutAllMessage'), [
      { text: t('common.dismiss'), style: 'cancel' },
      { text: t('sessions.logoutAllConfirm'), style: 'destructive', onPress: () => logoutAll.mutate() },
    ]);

  if (sessions.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Screen edges={['bottom']} contentStyle={styles.screen}>
      <FlatList
        data={sessions.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={sessions.isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            onRefresh={() => {
              void sessions.refetch();
            }}
          />
        }
        ListHeaderComponent={<FormError messages={(sessions.error ?? revoke.error ?? logoutAll.error)?.messages} />}
        ListEmptyComponent={
          sessions.isError ? undefined : (
            <Text muted style={styles.empty}>
              {t('sessions.empty')}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Card padded={false}>
            <ListItem
              icon={item.deviceType === 'Desktop' ? 'computer' : 'smartphone'}
              title={item.deviceName || t('sessions.unknownDevice')}
              subtitle={describe(item, t)}
              last
              trailing={
                item.isThisDevice ? (
                  <View style={styles.badge}>
                    <Text variant="caption" color={colors.primary}>
                      {t('sessions.thisDevice')}
                    </Text>
                  </View>
                ) : (
                  <Button
                    title={t('sessions.revoke')}
                    variant="ghost"
                    style={styles.revoke}
                    disabled={revoke.isPending}
                    onPress={() => confirmRevoke(item)}
                  />
                )
              }
            />
          </Card>
        )}
        ListFooterComponent={
          (sessions.data?.length ?? 0) > 0 ? (
            <Button
              title={t('sessions.logoutAll')}
              variant="secondary"
              loading={logoutAll.isPending}
              onPress={confirmLogoutAll}
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { padding: 0 },
  list: { padding: Spacing.xl, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
  empty: { textAlign: 'center', marginTop: Spacing.xl },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  revoke: { minHeight: 36, paddingHorizontal: Spacing.sm },
}));

