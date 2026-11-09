import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { Badge, Chip, EmptyState, ErrorState, Icon, ListItem, SkeletonList } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { flattenPages } from '@/lib/api';
import { plural } from '@/lib/i18n';

import { RECURRING_PAYMENT_PERMISSIONS } from '../constants';
import { kindIcon, planAmountText, planMeta } from '../display';
import { useRecurringPaymentsInfinite } from '../hooks';
import { CardRow, SectionHeader } from './form/Bits';

/** Sabit ödemeler · Planlar: aktif (ya da pasif) planlar, sonsuz kaydırma; dokununca plan düzenleme. */
export function PlansView() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const [showInactive, setShowInactive] = useState(false);
  const query = useRecurringPaymentsInfinite({ isActive: !showInactive });
  const plans = flattenPages(query.data?.pages);
  const total = query.data?.pages[0]?.totalCount ?? 0;
  const canCreate = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.DELETE);
  const canOpen = canUpdate || canDelete;

  const header = (
    <View style={styles.header}>
      <SectionHeader
        title={
          query.isPending
            ? ''
            : plural(
                showInactive ? 'recurring.plans.inactiveCount' : 'recurring.plans.activeCount',
                total,
                { count: total },
              )
        }
        actionLabel={canCreate ? t('recurring.plans.add') : undefined}
        actionIcon="add"
        onAction={canCreate ? () => router.push('/recurring/new') : undefined}
      />
      <View style={styles.filters}>
        <Chip
          label={t('recurring.plans.showInactive')}
          selected={showInactive}
          icon={showInactive ? 'check' : undefined}
          onPress={() => setShowInactive((v) => !v)}
        />
      </View>
    </View>
  );

  if (query.isPending) {
    return (
      <View style={styles.padded}>
        {header}
        <SkeletonList rows={5} />
      </View>
    );
  }
  if (query.isError && plans.length === 0) {
    return (
      <View style={styles.padded}>
        {header}
        <ErrorState
          title={t('common.error')}
          message={query.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      </View>
    );
  }

  return (
    <FlashList
      data={plans}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
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
      ListEmptyComponent={
        <EmptyState
          icon="event-repeat"
          title={
            showInactive ? t('recurring.plans.emptyInactive') : t('recurring.plans.emptyTitle')
          }
          message={showInactive ? undefined : t('recurring.plans.emptyMessage')}
          actionLabel={canCreate && !showInactive ? t('recurring.plans.add') : undefined}
          actionIcon="add"
          onAction={canCreate && !showInactive ? () => router.push('/recurring/new') : undefined}
        />
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : null
      }
      renderItem={({ item, index }) => (
        <CardRow first={index === 0} last={index === plans.length - 1}>
          <ListItem
            kind="record"
            icon={kindIcon(item.kind)}
            title={item.name}
            subtitle={planMeta(item)}
            amount={planAmountText(item)}
            amountCaption={item.kind === 'Installment' ? t('recurring.plans.perMonth') : undefined}
            trailing={
              <View style={styles.trailing}>
                {!item.isActive ? <Badge label={t('common.inactive')} variant="neutral" /> : null}
                {canOpen ? (
                  <Icon name="chevron-right" size={20} color={colors.textDisabled} />
                ) : null}
              </View>
            }
            last={index === plans.length - 1}
            onPress={
              canOpen
                ? () =>
                    router.push({ pathname: '/recurring/[id]', params: { id: String(item.id) } })
                : undefined
            }
          />
        </CardRow>
      )}
    />
  );
}

const useStyles = makeStyles(() => ({
  padded: { flex: 1, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  header: { gap: Spacing.xs, paddingBottom: Spacing.sm },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  footer: { marginVertical: Spacing.lg },
}));
