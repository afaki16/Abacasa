import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { Chip, EmptyState, ErrorState, SkeletonList, Text } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { FundCard } from '@/features/donationFunds/components/FundCard';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { useDonationFundsInfinite } from '@/features/donationFunds/hooks';
import { CardRow, HeaderTextAction } from '@/features/recurringPayments/components/form/Bits';
import { flattenPages } from '@/lib/api';

/** Emanetler (ek modül): açık / kapanmış emanetler, elde kalan ve dağıtım çubuğu. */
export default function DonationFundsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationFunds.title') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_FUND_PERMISSIONS.READ}>
          <Funds />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function Funds() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const [closed, setClosed] = useState(false);
  const query = useDonationFundsInfinite({ isClosed: closed });
  const funds = flattenPages(query.data?.pages);
  const canCreate = useHasPermission(DONATION_FUND_PERMISSIONS.CREATE);

  const header = (
    <View style={styles.header}>
      <Text variant="label" muted>
        {t('donationFunds.intro')}
      </Text>
      <View style={styles.filters}>
        <Chip label={t('donationFunds.open')} selected={!closed} onPress={() => setClosed(false)} />
        <Chip
          label={t('donationFunds.closedPlural')}
          selected={closed}
          onPress={() => setClosed(true)}
        />
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
                  label={t('donationFunds.add')}
                  onPress={() => router.push('/donation-funds/new')}
                />
              )
            : undefined,
        }}
      />
      {query.isPending ? (
        <View style={styles.padded}>
          {header}
          <SkeletonList rows={3} />
        </View>
      ) : query.isError && funds.length === 0 ? (
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
          data={funds}
          keyExtractor={(f) => String(f.id)}
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
              icon="savings"
              title={closed ? t('donationFunds.emptyClosed') : t('donationFunds.emptyTitle')}
              message={closed ? undefined : t('donationFunds.emptyMessage')}
              actionLabel={canCreate && !closed ? t('donationFunds.add') : undefined}
              actionIcon="add"
              onAction={canCreate && !closed ? () => router.push('/donation-funds/new') : undefined}
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <CardRow first={index === 0} last={index === funds.length - 1}>
              <FundCard
                fund={item}
                last={index === funds.length - 1}
                onPress={() =>
                  router.push({ pathname: '/donation-funds/[id]', params: { id: String(item.id) } })
                }
              />
            </CardRow>
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  padded: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.md },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  header: { gap: Spacing.sm, paddingBottom: Spacing.md },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  footer: { marginVertical: Spacing.lg },
}));
