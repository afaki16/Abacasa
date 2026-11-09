import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { Chip, EmptyState, ErrorState, Skeleton, SkeletonList, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { DebtCard } from '@/features/debts/components/DebtCard';
import { DebtSummaryCard } from '@/features/debts/components/DebtSummaryCard';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { debtListRows } from '@/features/debts/debtForm';
import { useDebtsInfinite, useDebtSummary } from '@/features/debts/hooks';
import { HeaderTextAction } from '@/features/recurringPayments/components/form/Bits';
import { flattenPages } from '@/lib/api';

/** Borçlar: açık borç özeti (TL / altın / döviz, güncel kurlar), alacaklıya göre borç kartları. */
export default function DebtsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('debts.title') }} />
      <RequirePermission permission={DEBT_PERMISSIONS.READ}>
        <Debts />
      </RequirePermission>
    </>
  );
}

function Debts() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const [closed, setClosed] = useState(false);
  const summary = useDebtSummary();
  const query = useDebtsInfinite({ isClosed: closed });
  const debts = flattenPages(query.data?.pages);
  const rows = debtListRows(debts);
  const canCreate = useHasPermission(DEBT_PERMISSIONS.CREATE);

  const header = (
    <View style={styles.header}>
      {summary.isPending ? (
        <Skeleton height={128} radius={Radius.lg} />
      ) : summary.isError ? (
        <ErrorState
          title={t('common.error')}
          message={summary.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void summary.refetch()}
        />
      ) : (
        <DebtSummaryCard summary={summary.data} />
      )}
      <View style={styles.filters}>
        <Chip label={t('debts.filters.open')} selected={!closed} onPress={() => setClosed(false)} />
        <Chip label={t('debts.filters.closed')} selected={closed} onPress={() => setClosed(true)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: canCreate
            ? () => (
                <HeaderTextAction
                  label={t('common.add')}
                  onPress={() => router.push('/debts/new')}
                />
              )
            : undefined,
        }}
      />
      {query.isPending ? (
        <View style={styles.padded}>
          <SkeletonList card rows={3} />
        </View>
      ) : query.isError && debts.length === 0 ? (
        <View style={styles.padded}>
          <ErrorState
            title={t('common.error')}
            message={query.error.message}
            actionLabel={t('common.retry')}
            onAction={() => void query.refetch()}
          />
        </View>
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.key}
          getItemType={(r) => r.type}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={(query.isRefetching && !query.isFetchingNextPage) || summary.isRefetching}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.background}
              onRefresh={() => {
                void query.refetch();
                void summary.refetch();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="account-balance-wallet"
              title={closed ? t('debts.emptyClosed') : t('debts.emptyTitle')}
              message={closed ? undefined : t('debts.emptyMessage')}
              actionLabel={canCreate && !closed ? t('debts.add') : undefined}
              actionIcon="add"
              onAction={canCreate && !closed ? () => router.push('/debts/new') : undefined}
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : null
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Text variant="section" accessibilityRole="header" style={styles.creditor}>
                {item.name}
              </Text>
            ) : (
              <View style={styles.cardWrap}>
                <DebtCard
                  debt={item.debt}
                  onPress={() =>
                    router.push({ pathname: '/debts/[id]', params: { id: String(item.debt.id) } })
                  }
                />
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  padded: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  header: { gap: Spacing.md, paddingBottom: Spacing.xs },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  creditor: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  cardWrap: { paddingBottom: Spacing.sm },
  footer: { marginVertical: Spacing.lg },
}));
