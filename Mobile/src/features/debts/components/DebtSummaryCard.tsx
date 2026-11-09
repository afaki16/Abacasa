import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing } from '@/constants/theme';
import { plural } from '@/lib/i18n';
import { formatAmount, formatMoney } from '@/lib/format/money';
import { formatShortDate } from '@/lib/format/period';

import { summaryColumns } from '../debtForm';
import type { DebtSummary } from '../types';

/** Açık borç özeti: TL karşılığı (güncel kurla), açık borç sayısı, TL / Altın / Döviz sütunları, kurlar. */
export function DebtSummaryCard({ summary }: { summary: DebtSummary }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const cols = summaryColumns(summary);
  const total = summary.openTotalInTry;
  const rates = summary.rates.map(
    (r) =>
      `${t(`ui.currency.short.${r.currency}`)} ${formatMoney(r.rate)} (${t(`debts.rateSource.${r.source}`)} ${formatShortDate(r.date)})`,
  );

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text variant="label" muted>
            {t('debts.summary.openInTry')}
          </Text>
          <Text tabular style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
            {total === null ? '—' : formatMoney(total)}
          </Text>
          {total === null ? (
            <Text variant="caption" muted>
              {t('debts.summary.noRate')}
            </Text>
          ) : null}
        </View>
        <Badge
          label={plural('debts.summary.openCount', summary.openCount, { count: summary.openCount })}
          variant="neutral"
        />
      </View>
      <View style={styles.cols}>
        <Column label={t('debts.summary.try')} value={formatMoney(cols.tryOpen)} />
        <Column
          label={t('debts.summary.gold')}
          value={formatAmount(cols.goldOpen, 'QuarterGold')}
        />
        <Column
          label={t('debts.summary.fx')}
          value={
            cols.fx.length ? cols.fx.map((f) => formatAmount(f.open, f.currency)).join(' · ') : '—'
          }
        />
      </View>
      {rates.length ? (
        <Text variant="caption" muted tabular>
          {t('debts.summary.rates', { rates: rates.join(' · ') })}
        </Text>
      ) : null}
    </View>
  );
}

function Column({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.col} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text tabular style={styles.colValue} numberOfLines={2} adjustsFontSizeToFit>
        {value}
      </Text>
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
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  flex: { flex: 1, gap: 2 },
  total: { fontWeight: '700', fontSize: 24, lineHeight: 30 },
  cols: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  col: { flex: 1, gap: 2 },
  colValue: { fontWeight: '600', fontSize: 14, lineHeight: 20 },
}));
