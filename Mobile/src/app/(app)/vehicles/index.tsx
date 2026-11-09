import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { EmptyState, ErrorState, SkeletonList } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { HeaderTextAction } from '@/features/categories/components/DefinitionKit';
import { VehicleCard } from '@/features/vehicles/components/VehicleCard';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useVehiclesInfinite } from '@/features/vehicles/hooks';
import { vehicleRoutes } from '@/features/vehicles/routes';
import { flattenPages } from '@/lib/api';
import { todayIso } from '@/lib/format/period';

/** Araçlar: kart listesi, en yakın hatırlatma rozeti (hiçbir toplama girmez). */
export default function VehiclesScreen() {
  return (
    <RequirePermission permission={VEHICLE_PERMISSIONS.READ}>
      <Vehicles />
    </RequirePermission>
  );
}

function Vehicles() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const canCreate = useHasPermission(VEHICLE_PERMISSIONS.CREATE);
  const query = useVehiclesInfinite({});
  const vehicles = flattenPages(query.data?.pages);
  const today = todayIso();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('vehicles.title'),
          headerRight: canCreate
            ? () => (
                <HeaderTextAction
                  label={t('common.add')}
                  onPress={() => router.push(vehicleRoutes.new)}
                />
              )
            : undefined,
        }}
      />
      {query.isPending ? (
        <View style={styles.list}>
          <SkeletonList rows={3} />
        </View>
      ) : query.isError && vehicles.length === 0 ? (
        <ErrorState
          title={t('common.error')}
          message={query.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      ) : (
        <FlashList
          data={vehicles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.background}
              onRefresh={() => void query.refetch()}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon="directions-car"
              title={t('vehicles.emptyTitle')}
              message={t('vehicles.emptyMessage')}
              actionLabel={canCreate ? t('vehicles.add') : undefined}
              actionIcon="add"
              onAction={canCreate ? () => router.push(vehicleRoutes.new) : undefined}
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : null
          }
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              today={today}
              onPress={() => router.push(vehicleRoutes.detail(item.id))}
            />
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  separator: { height: 10 },
  footer: { marginVertical: Spacing.lg },
}));
