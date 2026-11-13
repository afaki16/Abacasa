import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { EmptyState, ErrorState, Icon, ListItem, StatCard, SummaryCard, Text } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import { BUDGET_PERMISSIONS } from '@/features/budgets/constants';
import { useBudgetReport } from '@/features/budgets/hooks';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { EXCHANGE_RATE_PERMISSIONS } from '@/features/exchangeRates/constants';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { RECURRING_PAYMENT_PERMISSIONS } from '@/features/recurringPayments/constants';
import { enumLabel } from '@/lib/domain/enums';
import { formatMoney, formatOpenLine } from '@/lib/format/money';
import { todayIso, type Period } from '@/lib/format/period';
import { plural } from '@/lib/i18n';

import { useDashboard } from '../hooks';
import { go, ROUTES } from '../links';
import { useSelectedPeriod } from '../periodStore';
import type { Dashboard } from '../types';
import { splitUpcoming } from '../upcoming';
import { BreakdownSection, OverviewSkeleton, UpcomingSection, VehicleSection } from './OverviewSections';
import { PeriodBar } from './PeriodBar';

/** Dönemde hiç hareket yoksa (yeni hane / yeni üye) boş durum gösterilir. */
export function isDashboardEmpty(d: Dashboard): boolean {
  return (
    d.spent.total === 0 &&
    d.pending.total === 0 &&
    d.pending.count === 0 &&
    d.mealCard.total === 0 &&
    d.recurring.total === 0 &&
    d.upcoming.length === 0 &&
    d.byPaymentMethod.length === 0 &&
    d.debts.openCount === 0
  );
}

/**
 * Özet sekmesinin içeriği (Dashboard.Read): dönem seçici, dönem toplamı, sabit ödeme ve açık borç kartları,
 * yemek kartı, yaklaşan ödemeler, araç hatırlatmaları, kırılımlar. Aşağı çekince yenilenir.
 */
export function Overview() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const { period } = useSelectedPeriod();
  const query = useDashboard(period, today);
  const canCreateExpense = useHasPermission(EXPENSE_PERMISSIONS.CREATE);

  const data = query.data;
  const empty = data ? isDashboardEmpty(data) : false;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, empty && styles.grow]}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
        />
      }
    >
      <PeriodBar />
      {query.isPending ? (
        <OverviewSkeleton />
      ) : query.isError && !data ? (
        <ErrorState
          title={t('summary.loadError')}
          message={query.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      ) : !data ? null : empty ? (
        <EmptyState
          icon="receipt-long"
          title={t('summary.empty.title')}
          message={t('summary.empty.message')}
          actionLabel={canCreateExpense ? t('summary.empty.action') : undefined}
          actionIcon="add"
          onAction={() => go(ROUTES.newExpense)}
        />
      ) : (
        <OverviewBody data={data} today={today} period={period} />
      )}
    </ScrollView>
  );
}

function OverviewBody({ data, today, period }: { data: Dashboard; today: string; period: Period }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const canOpenRecurring = useHasPermission(RECURRING_PAYMENT_PERMISSIONS.READ);
  const canOpenDebts = useHasPermission(DEBT_PERMISSIONS.READ);
  const canOpenRates = useHasPermission(EXCHANGE_RATE_PERMISSIONS.READ);
  const canReadBudget = useHasPermission(BUDGET_PERMISSIONS.READ);
  // Bütçe takvim ayıyla çalışır; kart döneminde dönemin adlandırıldığı ay
  const budget = useBudgetReport(period.year, period.month, today, canReadBudget);
  const { recurring, vehicles } = splitUpcoming(data.upcoming);

  const { debts } = data;
  // Açığı olup kuru olmayan birimler (Borçlar sayfasıyla aynı kural).
  const missingRates = debts.foreign.filter((f) => f.openInTry === null).map((f) => enumLabel('currency', f.currency));
  const debtValue = debts.openTotalInTry !== null ? formatMoney(debts.openTotalInTry) : formatOpenLine(debts.openTry, debts.foreign);
  const debtCount = plural('summary.debts.count', debts.openCount);
  const debtCaption =
    debts.openTotalInTry !== null && debts.foreign.length > 0 ? `${t('summary.debts.inTry')} · ${debtCount}` : debtCount;

  const rec = data.recurring;

  return (
    <>
      <SummaryCard
        label={t('summary.card.periodTotal')}
        amount={formatMoney(data.outflowTotal)}
        caption={data.pending.unknownCount > 0 ? plural('summary.card.unknownAmounts', data.pending.unknownCount) : undefined}
        stats={[
          { label: t('summary.card.expenses'), value: formatMoney(data.spent.expenses) },
          { label: t('summary.card.donations'), value: formatMoney(data.spent.donations) },
          { label: t('summary.card.pending'), value: formatMoney(data.pending.total) },
        ]}
      />

      {budget.data ? <BudgetCard report={budget.data} onPress={() => go(ROUTES.budgets)} /> : null}

      <View style={styles.pair}>
        <Pressable
          accessibilityRole={canOpenRecurring ? 'button' : undefined}
          accessibilityLabel={t('summary.recurring.a11y', {
            paid: formatMoney(rec.paidTotal),
            pending: formatMoney(rec.pendingTotal),
          })}
          disabled={!canOpenRecurring}
          onPress={() => go(ROUTES.recurring)}
          style={({ pressed }) => [styles.flex, pressed && styles.pressed]}
        >
          <StatCard
            icon="event-repeat"
            accent="teal"
            title={t('summary.recurring.title')}
            progress={rec.total > 0 ? rec.paidTotal / rec.total : 0}
            style={styles.fill}
          >
            <KeyValue label={t('summary.recurring.paid')} value={formatMoney(rec.paidTotal)} />
            <KeyValue label={t('summary.recurring.pending')} value={formatMoney(rec.pendingTotal)} />
            {rec.unknownCount > 0 ? (
              <Text variant="caption" muted>
                {plural('summary.card.unknownAmounts', rec.unknownCount)}
              </Text>
            ) : null}
          </StatCard>
        </Pressable>

        <View style={styles.flex}>
          <Pressable
            accessibilityRole={canOpenDebts ? 'button' : undefined}
            accessibilityLabel={[t('summary.debts.title'), debtValue, debtCaption].join(', ')}
            disabled={!canOpenDebts}
            onPress={() => go(ROUTES.debts)}
            style={({ pressed }) => [styles.flex, pressed && styles.pressed]}
          >
            <StatCard
              icon="account-balance-wallet"
              accent="primary"
              title={t('summary.debts.title')}
              value={debtValue}
              caption={debtCaption}
              style={styles.fill}
            >
              {missingRates.length > 0 ? (
                <Pressable
                  accessibilityRole={canOpenRates ? 'link' : undefined}
                  accessibilityLabel={t('summary.debts.missingRate', { currencies: missingRates.join(', ') })}
                  disabled={!canOpenRates}
                  onPress={() => go(ROUTES.exchangeRates)}
                  style={styles.warning}
                >
                  <Icon name="warning" size={15} color={colors.badges.pending.fg} />
                  <Text variant="caption" color={colors.badges.pending.fg} style={styles.flex}>
                    {t('summary.debts.missingRate', { currencies: missingRates.join(', ') })}
                  </Text>
                </Pressable>
              ) : null}
            </StatCard>
          </Pressable>
        </View>
      </View>

      {data.mealCard.total > 0 ? (
        <View style={styles.card}>
          <ListItem
            kind="record"
            icon="lunch-dining"
            title={t('summary.mealCard.title')}
            subtitle={t('summary.mealCard.notIncluded')}
            amount={formatMoney(data.mealCard.total)}
            amountCaption={
              data.mealCard.pending > 0 ? t('summary.pendingAmount', { amount: formatMoney(data.mealCard.pending) }) : undefined
            }
            last
          />
        </View>
      ) : null}

      <UpcomingSection items={recurring} today={today} />
      <VehicleSection items={vehicles} today={today} />
      <BreakdownSection data={data} period={period} />
    </>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.keyValue}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="caption" tabular style={styles.keyValueStrong}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xl, gap: Spacing.md },
  grow: { flexGrow: 1 },
  pair: { flexDirection: 'row', gap: Spacing.md, alignItems: 'stretch' },
  flex: { flex: 1 },
  fill: { flexGrow: 1 },
  pressed: { opacity: 0.85 },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  keyValue: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.xs },
  keyValueStrong: { fontFamily: FontFamily.semibold, color: c.text },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: c.badges.pending.bg,
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
}));
