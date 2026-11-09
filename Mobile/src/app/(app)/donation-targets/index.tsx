import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Chip, EmptyState, ErrorState, SelectSheet, SkeletonList, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { yearOptions } from '@/features/donations/summary';
import { DONATION_TARGET_PERMISSIONS } from '@/features/donationTargets/constants';
import { useDonationTargetReport } from '@/features/donationTargets/hooks';
import { sortTargetRows, targetProgress } from '@/features/donationTargets/report';
import { ProgressBar, SectionHeader } from '@/features/recurringPayments/components/form/Bits';
import { enumLabel } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { todayIso } from '@/lib/format/period';

/** Bağış hedefleri (ek modül): yıl seçimi, hedef başına gerçekleşen / hedef / planlanan, hedef dışı bağışlar. */
export default function DonationTargetsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationTargets.title') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_TARGET_PERMISSIONS.READ}>
          <Targets />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function Targets() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [yearOpen, setYearOpen] = useState(false);
  const report = useDonationTargetReport(year, today);
  const canCreate = useHasPermission(DONATION_TARGET_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(DONATION_TARGET_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(DONATION_TARGET_PERMISSIONS.DELETE);
  const household = t('donations.household');
  const addTarget = () =>
    router.push({ pathname: '/donation-targets/new', params: { year: String(year) } });

  const rows = report.data ? sortTargetRows(report.data.rows) : [];
  const voluntary = report.data?.voluntary.filter((v) => v.given > 0) ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={report.isRefetching}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
          onRefresh={() => void report.refetch()}
        />
      }
    >
      <View style={styles.toolbar}>
        <View style={styles.flex}>
          <SectionHeader
            title={t('donationTargets.yearTitle', { year })}
            actionLabel={canCreate ? t('donationTargets.add') : undefined}
            actionIcon="add"
            onAction={canCreate ? addTarget : undefined}
          />
        </View>
        <Chip
          label={String(year)}
          chevron
          onPress={() => setYearOpen(true)}
          accessibilityLabel={t('donations.pickYear', { year })}
        />
      </View>

      {report.isPending ? (
        <SkeletonList rows={3} />
      ) : report.isError ? (
        <ErrorState
          title={t('common.error')}
          message={report.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void report.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="flag"
          title={t('donationTargets.emptyTitle', { year })}
          message={t('donationTargets.emptyMessage')}
          actionLabel={canCreate ? t('donationTargets.add') : undefined}
          actionIcon="add"
          onAction={canCreate ? addTarget : undefined}
        />
      ) : (
        <View style={styles.card}>
          {rows.map((row, i) => {
            const p = targetProgress(row);
            const name = enumLabel('donationKind', row.kind);
            const owner = row.ownerName ?? household;
            const openable = canUpdate || canDelete;
            return (
              <Pressable
                key={row.targetId}
                accessibilityRole={openable ? 'button' : undefined}
                accessibilityLabel={[
                  name,
                  owner,
                  p.done
                    ? t('donationTargets.completed')
                    : t('donations.percent', { value: p.percent }),
                  t('donationTargets.given', { amount: formatMoney(row.given) }),
                  t('donationTargets.target', { amount: formatMoney(row.target) }),
                ].join(', ')}
                disabled={!openable}
                onPress={() =>
                  router.push({
                    pathname: '/donation-targets/[id]',
                    params: { id: String(row.targetId) },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.line}>
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">{name}</Text>
                    <Text variant="caption" muted>
                      {owner}
                    </Text>
                  </View>
                  <Text
                    variant="label"
                    tabular
                    color={p.done ? colors.badges.paid.fg : colors.badges.info.fg}
                    style={styles.pct}
                  >
                    {p.done
                      ? t('donationTargets.completed')
                      : t('donations.percent', { value: p.percent })}
                  </Text>
                </View>
                <ProgressBar value={p.share} tone={p.done ? 'success' : 'teal'} />
                <View style={styles.line}>
                  <Text variant="caption" muted tabular style={styles.flex}>
                    {t('donationTargets.given', { amount: formatMoney(row.given) })}
                  </Text>
                  <Text variant="caption" muted tabular>
                    {t('donationTargets.target', { amount: formatMoney(row.target) })}
                  </Text>
                </View>
                {!p.done && row.planned > 0 ? (
                  <Text variant="caption" muted tabular>
                    {t('donationTargets.planned', {
                      amount: formatMoney(row.planned),
                      after: formatMoney(Math.max(0, row.remainingAfterPlan)),
                    })}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {voluntary.length > 0 ? (
        <>
          <SectionHeader title={t('donationTargets.voluntary')} />
          <View style={styles.card}>
            {voluntary.map((v, i) => (
              <View
                key={`${v.personId ?? 'h'}-${v.kind}`}
                style={[styles.row, styles.line, i > 0 && styles.divider]}
              >
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{enumLabel('donationKind', v.kind)}</Text>
                  <Text variant="caption" muted>
                    {v.name ?? household}
                  </Text>
                </View>
                <Text variant="bodyStrong" tabular>
                  {formatMoney(v.given)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SelectSheet<number>
        visible={yearOpen}
        onClose={() => setYearOpen(false)}
        title={t('donations.yearTitle')}
        options={yearOptions(currentYear).map((y) => ({ value: y, label: String(y) }))}
        value={year}
        onSelect={setYear}
        searchable={false}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  content: { padding: Spacing.lg, gap: Spacing.md },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: { gap: 8, paddingVertical: Spacing.md, paddingHorizontal: 14 },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  pressed: { backgroundColor: c.surface },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pct: { fontWeight: '600' },
}));
