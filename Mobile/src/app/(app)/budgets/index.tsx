import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { EmptyState, ErrorState, Icon, SkeletonList, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import { BUDGET_PERMISSIONS } from '@/features/budgets/constants';
import { useBudgetReport, useBudgets } from '@/features/budgets/hooks';
import { budgetRoutes } from '@/features/budgets/routes';
import { SectionHeader } from '@/features/recurringPayments/components/form/Bits';
import { formatMoney } from '@/lib/format/money';
import { addMonths, monthName, todayIso } from '@/lib/format/period';

/** Aylık bütçe: ay seçimi, ayın bütçe özeti (hane, kişiler, Ortak) ve bütçe kayıtları. */
export default function BudgetsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('budgets.title') }} />
      <RequirePermission permission={BUDGET_PERMISSIONS.READ}>
        <Budgets />
      </RequirePermission>
    </>
  );
}

function Budgets() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const [y, m] = today.split('-').map(Number);
  const [ym, setYm] = useState({ year: y, month: m });
  const report = useBudgetReport(ym.year, ym.month, today);
  const list = useBudgets();
  const canCreate = useHasPermission(BUDGET_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(BUDGET_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(BUDGET_PERMISSIONS.DELETE);
  const household = t('donations.household');
  const shift = (n: number) => setYm((p) => addMonths(p.year, p.month, n));
  const add = () => router.push(budgetRoutes.new(ym.year, ym.month));
  const label = `${monthName(ym.month)} ${ym.year}`;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={report.isRefetching || list.isRefetching}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
          onRefresh={() => void Promise.all([report.refetch(), list.refetch()])}
        />
      }
    >
      <View style={styles.monthBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('budgets.previousMonth')}
          hitSlop={8}
          onPress={() => shift(-1)}
          style={styles.arrow}
        >
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text variant="section" style={styles.monthLabel}>
          {label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('budgets.nextMonth')}
          hitSlop={8}
          onPress={() => shift(1)}
          style={styles.arrow}
        >
          <Icon name="chevron-right" size={24} color={colors.text} />
        </Pressable>
      </View>

      <Text variant="label" muted>
        {t('budgets.intro')}
      </Text>

      {report.isPending ? (
        <SkeletonList rows={3} />
      ) : report.isError ? (
        <ErrorState
          title={t('common.error')}
          message={report.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void report.refetch()}
        />
      ) : (
        <BudgetCard report={report.data} />
      )}

      <SectionHeader
        title={t('budgets.records')}
        actionLabel={canCreate ? t('budgets.add') : undefined}
        actionIcon="add"
        onAction={canCreate ? add : undefined}
      />

      {list.isPending ? (
        <SkeletonList rows={2} />
      ) : list.isError ? (
        <ErrorState
          title={t('common.error')}
          message={list.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void list.refetch()}
        />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon="savings"
          title={t('budgets.emptyTitle')}
          message={t('budgets.emptyMessage')}
          actionLabel={canCreate ? t('budgets.add') : undefined}
          actionIcon="add"
          onAction={canCreate ? add : undefined}
        />
      ) : (
        <View style={styles.card}>
          {list.data.map((b, i) => {
            const openable = canUpdate || canDelete;
            const owner = b.ownerName ?? household;
            const from = t('budgets.from', { month: `${monthName(b.startMonth)} ${b.startYear}` });
            const amount = b.amount > 0 ? formatMoney(b.amount) : t('budgets.ended');
            return (
              <Pressable
                key={b.id}
                accessibilityRole={openable ? 'button' : undefined}
                accessibilityLabel={[owner, from, amount].join(', ')}
                disabled={!openable}
                onPress={() => router.push(budgetRoutes.edit(b.id))}
                style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
              >
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{owner}</Text>
                  <Text variant="caption" muted>
                    {from}
                  </Text>
                </View>
                <Text variant="bodyStrong" tabular muted={b.amount === 0}>
                  {amount}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  content: { padding: Spacing.lg, gap: Spacing.md },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  arrow: { padding: Spacing.xs, borderRadius: Radius.sm },
  monthLabel: { minWidth: 150, textAlign: 'center' },
  flex: { flex: 1 },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, paddingHorizontal: 14 },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  pressed: { backgroundColor: c.surface },
}));
