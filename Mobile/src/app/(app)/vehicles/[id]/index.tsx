import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  SkeletonList,
  StateView,
  Text,
} from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { HeaderTextAction } from '@/features/categories/components/DefinitionKit';
import { ObligationRow } from '@/features/vehicles/components/ObligationRow';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useVehicle, useVehicleObligations } from '@/features/vehicles/hooks';
import {
  currentObligationIds,
  filterObligations,
  OBLIGATION_TYPES,
  obligationDue,
  obligationYearTotal,
} from '@/features/vehicles/reminders';
import { vehicleRoutes } from '@/features/vehicles/routes';
import { enumLabel, type VehicleObligationType } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { todayIso } from '@/lib/format/period';

/** Araç detayı: plaka, sahip, yıl gideri; tür filtresi ve işlemler (muayene, sigorta, kasko, MTV). */
export default function VehicleDetailScreen() {
  return (
    <RequirePermission permission={VEHICLE_PERMISSIONS.READ}>
      <VehicleDetail />
    </RequirePermission>
  );
}

function VehicleDetail() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const vehicle = useVehicle(id);
  const obligations = useVehicleObligations(id);
  const canUpdate = useHasPermission(VEHICLE_PERMISSIONS.UPDATE);
  const [filter, setFilter] = useState<VehicleObligationType | null>(null);
  const today = todayIso();
  const year = Number(today.slice(0, 4));

  if (vehicle.isPending) return <StateView kind="loading" />;
  if (vehicle.isError || !vehicle.data) {
    return (
      <ErrorState
        title={t('common.error')}
        message={vehicle.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void vehicle.refetch()}
      />
    );
  }
  const v = vehicle.data;
  const list = obligations.data ?? [];
  const currentIds = currentObligationIds(list);
  const visible = filterObligations(list, filter);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: v.name,
          headerRight: canUpdate
            ? () => (
                <HeaderTextAction
                  label={t('common.edit')}
                  onPress={() => router.push(vehicleRoutes.edit(id))}
                />
              )
            : undefined,
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.content, canUpdate && { paddingBottom: 96 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={vehicle.isRefetching || obligations.isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            onRefresh={() => {
              void vehicle.refetch();
              void obligations.refetch();
            }}
          />
        }
      >
        <View style={styles.info}>
          <InfoCell label={t('vehicles.plate')} value={v.plate} />
          <InfoCell label={t('vehicles.owner')} value={v.ownerName ?? t('vehicles.household')} />
          <InfoCell
            label={t('vehicles.yearSpend', { year })}
            value={obligations.data ? formatMoney(obligationYearTotal(list, year)) : '—'}
            tabular
          />
        </View>
        {!v.isActive ? (
          <Text variant="caption" muted>
            {t('vehicles.inactiveHint')}
          </Text>
        ) : null}
        {v.note ? (
          <Text variant="caption" muted>
            {v.note}
          </Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label={t('vehicles.filterAll')}
            selected={filter === null}
            onPress={() => setFilter(null)}
          />
          {OBLIGATION_TYPES.map((type) => (
            <Chip
              key={type}
              label={enumLabel('vehicleObligationType', type)}
              selected={filter === type}
              onPress={() => setFilter(type)}
            />
          ))}
        </ScrollView>

        {obligations.isPending ? (
          <SkeletonList rows={3} />
        ) : obligations.isError ? (
          <ErrorState
            title={t('common.error')}
            message={obligations.error.message}
            actionLabel={t('common.retry')}
            onAction={() => void obligations.refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="event-note"
            title={filter ? t('vehicles.noObligationsOfType') : t('vehicles.noObligations')}
            message={canUpdate ? t('vehicles.noObligationsHint') : undefined}
          />
        ) : (
          <View style={styles.card}>
            {visible.map((o, i) => (
              <ObligationRow
                key={o.id}
                obligation={o}
                first={i === 0}
                due={obligationDue(o, currentIds.has(o.id), v.isActive, today)}
                onPress={
                  canUpdate ? () => router.push(vehicleRoutes.obligation(id, o.id)) : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
      {canUpdate ? (
        <View style={[styles.fab, { bottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
          <Button
            title={t('vehicles.addObligation')}
            icon="add"
            onPress={() => router.push(vehicleRoutes.newObligation(id))}
          />
        </View>
      ) : null}
    </View>
  );
}

function InfoCell({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.infoCell}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text tabular={tabular} style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  info: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoCell: { flex: 1, gap: 2 },
  infoValue: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 18 },
  chips: { gap: Spacing.sm },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    shadowColor: c.primary,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderRadius: Radius.lg,
  },
}));
