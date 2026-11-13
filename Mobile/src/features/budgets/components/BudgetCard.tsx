import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { formatMoney } from '@/lib/format/money';
import { monthName } from '@/lib/format/period';
import { plural } from '@/lib/i18n';

import { usageShare, usageTone, type UsageTone } from '../form';
import type { BudgetReport, BudgetRow } from '../types';

export interface BudgetCardProps {
  report: BudgetReport;
  /** Verilirse kart dokunulabilir (Özet'ten Bütçe ekranına). */
  onPress?: () => void;
}

/**
 * Ayın bütçesi: hane için "bu ay harcayabileceğin", günlük limit ve kullanım çubuğu; kişi ve Ortak satırları.
 * Özet ve Bütçe ekranı ortak kullanır.
 */
export function BudgetCard({ report, onPress }: BudgetCardProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const { household, rows } = report;
  const title = t('budgets.cardTitle', { month: monthName(report.month), year: report.year });

  const headline = household ? (
    <>
      <Text variant="caption" muted>
        {household.remaining >= 0 ? t('budgets.canSpend') : t('budgets.overBy')}
      </Text>
      <Text
        variant="h1"
        tabular
        color={household.remaining < 0 ? colors.danger : undefined}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatMoney(Math.abs(household.remaining))}
      </Text>
      {household.dailyAllowance !== null ? (
        <Text variant="label" tabular>
          {t('budgets.daily', { amount: formatMoney(household.dailyAllowance) })} ·{' '}
          {plural('budgets.daysLeft', report.daysLeft)}
        </Text>
      ) : null}
      <UsageBar percent={household.usedPercent} height={8} />
      <Text variant="caption" muted tabular>
        {t('budgets.breakdown', {
          budget: formatMoney(household.budget),
          spent: formatMoney(household.spent),
          pending: formatMoney(household.pending),
        })}
      </Text>
    </>
  ) : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        household
          ? [
              title,
              household.remaining >= 0 ? t('budgets.canSpend') : t('budgets.overBy'),
              formatMoney(Math.abs(household.remaining)),
            ].join(', ')
          : title
      }
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Icon name="savings" size={18} color={colors.primary} />
        <Text variant="bodyStrong" style={styles.flex}>
          {title}
        </Text>
        {onPress ? <Icon name="chevron-right" size={20} color={colors.textMuted} /> : null}
      </View>

      {!household && rows.length === 0 ? (
        <Text variant="label" muted>
          {t('budgets.noBudget')}
        </Text>
      ) : null}

      {headline}

      {rows.map((row) => (
        <PersonRow key={row.isShared ? 'shared' : String(row.personId)} row={row} />
      ))}

      {report.personBudgetsExceedHousehold ? (
        <View style={[styles.note, { backgroundColor: colors.warningSurface }]}>
          <Icon name="warning" size={15} color={colors.badges.pending.fg} />
          <Text variant="caption" color={colors.badges.pending.fg} style={styles.flex}>
            {t('budgets.exceedsHousehold')}
          </Text>
        </View>
      ) : null}
      {report.pendingUnknownCount > 0 ? (
        <Text variant="caption" muted>
          {plural('budgets.unknownAmounts', report.pendingUnknownCount)}
        </Text>
      ) : null}
    </Pressable>
  );
}

function PersonRow({ row }: { row: BudgetRow }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const name = row.isShared ? t('budgets.shared') : row.name ?? t('donations.household');
  return (
    <View style={styles.row}>
      <View style={styles.line}>
        <Text variant="label" style={styles.flex} numberOfLines={1}>
          {name}
        </Text>
        <Text variant="label" tabular color={row.remaining < 0 ? colors.danger : undefined}>
          {row.remaining >= 0
            ? t('budgets.left', { amount: formatMoney(row.remaining) })
            : t('budgets.over', { amount: formatMoney(-row.remaining) })}
        </Text>
      </View>
      <UsageBar percent={row.usedPercent} height={6} />
      <Text variant="caption" muted tabular>
        {t('budgets.rowBreakdown', {
          used: formatMoney(row.used),
          budget: formatMoney(row.budget),
          percent: Math.round(row.usedPercent),
        })}
        {row.dailyAllowance !== null && row.remaining > 0
          ? ` · ${t('budgets.daily', { amount: formatMoney(row.dailyAllowance) })}`
          : ''}
      </Text>
    </View>
  );
}

function UsageBar({ percent, height }: { percent: number; height: number }) {
  const colors = useColors();
  const tone: UsageTone = usageTone(percent);
  const fill = tone === 'over' ? colors.danger : tone === 'warning' ? colors.warning : colors.primary;
  const track = tone === 'over' ? colors.dangerSurface : tone === 'warning' ? colors.warningSurface : colors.primarySoft;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(100, Math.max(0, percent))) }}
      style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}
    >
      <View style={{ height, width: `${usageShare(percent) * 100}%`, backgroundColor: fill, borderRadius: height / 2 }} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: Spacing.sm,
  },
  pressed: { opacity: 0.85 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  row: { gap: 6, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: c.border },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
}));
