import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { ErrorState, Skeleton, SkeletonList } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { HeaderTextAction } from '@/features/categories/components/DefinitionKit';
import { LedgerCellSheet } from '@/features/ledger/components/LedgerCellSheet';
import { LedgerYearView } from '@/features/ledger/components/LedgerYearView';
import { YearStepper } from '@/features/ledger/components/YearStepper';
import { LEDGER_PERMISSIONS } from '@/features/ledger/constants';
import { useLedgerYear } from '@/features/ledger/hooks';
import { ledgerRoutes } from '@/features/ledger/routes';
import { defaultMonth, type MonthLine } from '@/features/ledger/yearView';
import { todayIso } from '@/lib/format/period';

/** Yıllık tablo: gelirler elle; gider tarafı otomatik (plan vadeleri, plan dışı harcama ve bağış) + elle kalemler. */
export default function LedgerScreen() {
  return (
    <RequirePermission permission={LEDGER_PERMISSIONS.READ}>
      <Ledger />
    </RequirePermission>
  );
}

function Ledger() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => defaultMonth(Number(today.slice(0, 4)), today));
  const [editing, setEditing] = useState<MonthLine | null>(null);
  const canCreate = useHasPermission(LEDGER_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(LEDGER_PERMISSIONS.UPDATE);
  const query = useLedgerYear(year);

  const changeYear = (next: number) => {
    setYear(next);
    setMonth(defaultMonth(next, today));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('ledger.title', { year }),
          headerRight: canCreate
            ? () => (
                <HeaderTextAction
                  label={t('common.add')}
                  onPress={() => router.push(ledgerRoutes.newItem(year))}
                />
              )
            : undefined,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
            onRefresh={() => void query.refetch()}
          />
        }
      >
        <View style={styles.stepper}>
          <YearStepper year={year} onChange={changeYear} />
        </View>
        {query.isPending ? (
          <View style={styles.skeleton}>
            <Skeleton height={72} radius={Radius.lg} />
            <SkeletonList rows={4} />
          </View>
        ) : query.isError ? (
          <ErrorState
            title={t('common.error')}
            message={query.error.message}
            actionLabel={t('common.retry')}
            onAction={() => void query.refetch()}
          />
        ) : (
          <LedgerYearView
            data={query.data}
            month={month}
            onMonthChange={setMonth}
            onEditLine={canUpdate ? setEditing : undefined}
          />
        )}
      </ScrollView>
      <LedgerCellSheet
        line={editing}
        year={year}
        month={month}
        onClose={() => setEditing(null)}
        onEditItem={(id) => {
          setEditing(null);
          router.push(ledgerRoutes.item(id, year));
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { flexGrow: 1, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl, gap: Spacing.md },
  stepper: { paddingHorizontal: Spacing.lg },
  skeleton: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
}));
