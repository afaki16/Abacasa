import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Card, ListItem, SearchBar, StateView } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useUsersInfinite } from '@/features/users/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { flattenPages } from '@/lib/api';

/** Örnek modül — liste: arama (debounce), sonsuz kaydırma, aşağı çekip yenile, yetkiye göre "ekle". */
export default function UsersScreen() {
  return (
    <RequirePermission permission={USER_PERMISSIONS.READ}>
      <UsersList />
    </RequirePermission>
  );
}

function UsersList() {
  const [search, setSearch] = useState('');
  const searchTerm = useDebouncedValue(search);
  const canCreate = useHasPermission(USER_PERMISSIONS.CREATE);
  const query = useUsersInfinite({ searchTerm });
  const users = flattenPages(query.data?.pages);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: canCreate
            ? () => (
                <Pressable accessibilityRole="button" accessibilityLabel="Kullanıcı ekle" hitSlop={8} onPress={() => router.push('/users/new')}>
                  <Ionicons name="add" size={26} color={Colors.primary} />
                </Pressable>
              )
            : undefined,
        }}
      />

      <View style={styles.search}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Ad, soyad veya e-posta ara" />
      </View>

      {query.isPending ? (
        <StateView kind="loading" />
      ) : query.isError && users.length === 0 ? (
        <StateView kind="error" message={query.error.message} actionLabel="Tekrar dene" onAction={() => query.refetch()} />
      ) : (
        <FlashList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => {
                void query.refetch();
              }}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <StateView kind="empty" title={searchTerm ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'} />
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={Colors.primary} /> : null}
          renderItem={({ item }) => (
            <Card padded={false}>
              <ListItem
                title={item.fullName}
                subtitle={[item.email, item.roles.map((r) => r.name).join(', ')].filter(Boolean).join(' · ')}
                trailing={<UserStatusBadge status={item.status} />}
                last
                onPress={() => router.push({ pathname: '/users/[id]', params: { id: String(item.id) } })}
              />
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  search: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  separator: { height: Spacing.sm },
  footer: { marginVertical: Spacing.lg },
});
