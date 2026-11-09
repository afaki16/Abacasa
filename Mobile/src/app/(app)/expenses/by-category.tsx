import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView } from 'react-native';

import { ErrorState, Skeleton, SkeletonList, Text } from '@/components/ui';
import { FontFamily, makeStyles, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { toBreakdownRows } from '@/features/dashboard/breakdown';
import { BreakdownList } from '@/features/dashboard/components/BreakdownList';
import { PeriodBar } from '@/features/dashboard/components/PeriodBar';
import { useSelectedPeriod } from '@/features/dashboard/periodStore';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { useExpenseSummary } from '@/features/expenses/hooks';
import { categoryIcon } from '@/features/expenses/icons';
import { formatMoney } from '@/lib/format/money';

/** Kategoriye göre özet: seçili dönemin harcamaları kategori kırılımıyla (yemek kartı hariç). */
export default function ExpensesByCategoryScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('expenses.byCategory.title') }} />
      <RequirePermission permission={EXPENSE_PERMISSIONS.READ}>
        <ByCategory />
      </RequirePermission>
    </>
  );
}

function ByCategory() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const { period } = useSelectedPeriod();
  const summary = useExpenseSummary({ period });

  const rows = toBreakdownRows(
    (summary.data?.byCategory ?? []).map((c) => ({ key: `c-${c.categoryId}`, label: c.categoryName, amount: c.total })),
  ).map((row) => ({ ...row, icon: categoryIcon(row.label) }));

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={summary.isRefetching}
          onRefresh={() => void summary.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
        />
      }
    >
      <PeriodBar framed>
        {summary.data ? (
          <Text tabular style={styles.total}>
            {formatMoney(summary.data.total)}
          </Text>
        ) : (
          <Skeleton width={120} height={20} />
        )}
      </PeriodBar>
      {summary.isPending ? (
        <SkeletonList rows={6} card />
      ) : summary.isError ? (
        <ErrorState
          title={t('expenses.byCategory.loadError')}
          message={summary.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void summary.refetch()}
        />
      ) : (
        <>
          <BreakdownList rows={rows} emptyText={t('expenses.byCategory.empty')} />
          {summary.data.mealCardTotal > 0 ? (
            <Text variant="caption" muted style={styles.note}>
              {t('expenses.byCategory.mealCardNote', { amount: formatMoney(summary.data.mealCardTotal) })}
            </Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles(() => ({
  content: { padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },
  total: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26 },
  note: { paddingHorizontal: Spacing.xs },
}));
