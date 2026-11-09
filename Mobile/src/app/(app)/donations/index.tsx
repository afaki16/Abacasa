import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import {
  Card,
  Chip,
  EmptyState,
  ErrorState,
  ListItem,
  SegmentedControl,
  SelectSheet,
  Skeleton,
  SkeletonList,
  Text,
} from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { hasPermission, useHasPermission } from '@/features/auth/permissions';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { BreakdownCard } from '@/features/donations/components/BreakdownCard';
import { DonationRow } from '@/features/donations/components/DonationRow';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import { useDonationsInfinite, useDonationSummary } from '@/features/donations/hooks';
import {
  giverBreakdown,
  kindBreakdown,
  yearOptions,
  yearPeriod,
} from '@/features/donations/summary';
import { DONATION_TARGET_PERMISSIONS } from '@/features/donationTargets/constants';
import { CardRow, HeaderTextAction } from '@/features/recurringPayments/components/form/Bits';
import { flattenPages } from '@/lib/api';
import { plural } from '@/lib/i18n';
import { formatMoney } from '@/lib/format/money';
import { useAuthStore } from '@/stores/authStore';

type Breakdown = 'kind' | 'giver';

/** Bağışlar: yıl toplamı, türe / verene göre kırılım, son bağışlar (sonsuz kaydırma). */
export default function DonationsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donations.title') }} />
      <RequirePermission permission={DONATION_PERMISSIONS.READ}>
        <Donations />
      </RequirePermission>
    </>
  );
}

function Donations() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [yearOpen, setYearOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown>('kind');
  const period = yearPeriod(year);
  const summary = useDonationSummary({ period });
  const query = useDonationsInfinite({ period });
  const donations = flattenPages(query.data?.pages);
  const canCreate = useHasPermission(DONATION_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(DONATION_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(DONATION_PERMISSIONS.DELETE);
  // Ek modüller (hedefler, emanetler) hanede açıksa ve izin varsa.
  const extrasEnabled = useAuthStore((st) => !!st.user?.activeTenant?.modules.donationExtras);
  const canTargets = useAuthStore((st) => hasPermission(st.user, DONATION_TARGET_PERMISSIONS.READ));
  const canFunds = useAuthStore((st) => hasPermission(st.user, DONATION_FUND_PERMISSIONS.READ));
  const showTargets = extrasEnabled && canTargets;
  const showFunds = extrasEnabled && canFunds;

  const s = summary.data;
  const rows = s
    ? breakdown === 'kind'
      ? kindBreakdown(s)
      : giverBreakdown(s, t('donations.household'))
    : [];
  const caption = s
    ? [
        plural('donations.count', s.count, { count: s.count }),
        s.fundDistributedCount > 0
          ? t('donations.fundDistributed', { amount: formatMoney(s.fundDistributedTotal) })
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const header = (
    <View style={styles.header}>
      <View style={styles.totalCard}>
        <View style={styles.totalTexts}>
          <Text variant="label" muted>
            {t('donations.yearTotal', { year })}
          </Text>
          {summary.isPending ? (
            <Skeleton width={140} height={22} />
          ) : (
            <Text tabular style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(s?.total ?? 0)}
            </Text>
          )}
          {caption ? (
            <Text variant="label" muted tabular>
              {caption}
            </Text>
          ) : null}
        </View>
        <Chip
          label={String(year)}
          chevron
          onPress={() => setYearOpen(true)}
          accessibilityLabel={t('donations.pickYear', { year })}
        />
      </View>

      {showTargets || showFunds ? (
        <Card padded={false}>
          {showTargets ? (
            <ListItem
              icon="flag"
              title={t('donationTargets.title')}
              last={!showFunds}
              onPress={() => router.push('/donation-targets')}
            />
          ) : null}
          {showFunds ? (
            <ListItem
              icon="savings"
              title={t('donationFunds.title')}
              last
              onPress={() => router.push('/donation-funds')}
            />
          ) : null}
        </Card>
      ) : null}

      {summary.isError ? (
        <ErrorState
          title={t('common.error')}
          message={summary.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void summary.refetch()}
        />
      ) : rows.length > 0 ? (
        <>
          <SegmentedControl<Breakdown>
            accessibilityLabel={t('donations.breakdownLabel')}
            segments={[
              { value: 'kind', label: t('donations.byKind') },
              { value: 'giver', label: t('donations.byGiver') },
            ]}
            value={breakdown}
            onChange={setBreakdown}
          />
          <BreakdownCard rows={rows} />
        </>
      ) : null}

      {donations.length > 0 ? (
        <Text variant="section" accessibilityRole="header" style={styles.sectionTitle}>
          {t('donations.recent')}
        </Text>
      ) : null}
    </View>
  );

  const openable = canUpdate || canDelete;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: canCreate
            ? () => (
                <HeaderTextAction
                  label={t('common.add')}
                  onPress={() => router.push('/donations/new')}
                />
              )
            : undefined,
        }}
      />
      {query.isPending ? (
        <View style={styles.padded}>
          <SkeletonList card rows={4} />
        </View>
      ) : query.isError && donations.length === 0 ? (
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
          data={donations}
          keyExtractor={(d) => String(d.id)}
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
              icon="volunteer-activism"
              title={t('donations.emptyTitle', { year })}
              message={t('donations.emptyMessage')}
              actionLabel={canCreate ? t('donations.add') : undefined}
              actionIcon="add"
              onAction={canCreate ? () => router.push('/donations/new') : undefined}
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <CardRow first={index === 0} last={index === donations.length - 1}>
              <DonationRow
                donation={item}
                last={index === donations.length - 1}
                onPress={
                  openable
                    ? () =>
                        router.push({
                          pathname: '/donations/[id]',
                          params: { id: String(item.id) },
                        })
                    : undefined
                }
              />
            </CardRow>
          )}
        />
      )}

      <SelectSheet<number>
        visible={yearOpen}
        onClose={() => setYearOpen(false)}
        title={t('donations.yearTitle')}
        options={yearOptions(currentYear).map((y) => ({ value: y, label: String(y) }))}
        value={year}
        onSelect={setYear}
        searchable={false}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  padded: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  header: { gap: Spacing.md, paddingBottom: Spacing.sm },
  totalCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  totalTexts: { flex: 1, gap: 2 },
  total: { fontWeight: '700', fontSize: 22, lineHeight: 28 },
  sectionTitle: { marginTop: Spacing.xs },
  footer: { marginVertical: Spacing.lg },
}));
