import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Button, Card, FormError, ListItem, Screen, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLogoutAll, useRevokeSession, useSessions, type SessionItem } from '@/features/auth/hooks';

const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

function describe(session: SessionItem) {
  const parts = [`Giriş: ${dateFormat.format(new Date(session.createdDate))}`];
  if (session.ipAddress) parts.push(session.ipAddress);
  return parts.join(' · ');
}

/** Hesabın açık olduğu cihazlar. Tek oturum ya da hepsi kapatılabilir. */
export default function SessionsScreen() {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const logoutAll = useLogoutAll();

  const confirmRevoke = (session: SessionItem) =>
    Alert.alert('Oturumu kapat', `${session.deviceName || 'Bu cihaz'} oturumu kapatılacak.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kapat', style: 'destructive', onPress: () => revoke.mutate(session.id) },
    ]);

  const confirmLogoutAll = () =>
    Alert.alert('Tüm cihazlardan çık', 'Bu cihaz dahil bütün oturumların kapatılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Hepsinden çık', style: 'destructive', onPress: () => logoutAll.mutate() },
    ]);

  if (sessions.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
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
            onRefresh={() => {
              void sessions.refetch();
            }}
          />
        }
        ListHeaderComponent={<FormError messages={(sessions.error ?? revoke.error ?? logoutAll.error)?.messages} />}
        ListEmptyComponent={
          sessions.isError ? undefined : (
            <Text muted style={styles.empty}>
              Açık oturum yok.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Card padded={false}>
            <ListItem
              icon={item.deviceType === 'Desktop' ? 'desktop-outline' : 'phone-portrait-outline'}
              title={item.deviceName || 'Bilinmeyen cihaz'}
              subtitle={describe(item)}
              last
              trailing={
                item.isThisDevice ? (
                  <View style={styles.badge}>
                    <Text variant="caption" color={Colors.primary}>
                      Bu cihaz
                    </Text>
                  </View>
                ) : (
                  <Button
                    title="Kapat"
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
              title="Tüm cihazlardan çık"
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

const styles = StyleSheet.create({
  screen: { padding: 0 },
  list: { padding: Spacing.xl, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: Spacing.xl },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  revoke: { minHeight: 36, paddingHorizontal: Spacing.sm },
});
