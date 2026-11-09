import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { OutlineAction, ProgressBar } from '@/features/recurringPayments/components/form/Bits';
import { formatAmount } from '@/lib/format/money';
import { formatDisplayDate } from '@/lib/format/period';

import { debtProgress } from '../debtForm';
import type { DebtListItem } from '../types';

/** Borcun başlığı: notu, yoksa borçlu ve tarih (borçta ayrı ad alanı yok). */
export function debtTitle(
  d: Pick<DebtListItem, 'note' | 'debtorName' | 'date'>,
  householdLabel: string,
): string {
  return d.note?.trim() || `${d.debtorName ?? householdLabel} · ${formatDisplayDate(d.date)}`;
}

/** Borç kartı: başlık, toplam, ödeme çubuğu, ödenen / kalan, "Ödemeler" düğmesi. */
export function DebtCard({ debt, onPress }: { debt: DebtListItem; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const title = debtTitle(debt, t('debts.household'));
  const total = formatAmount(debt.amount, debt.currency);
  const paid = formatAmount(debt.paidAmount, debt.currency);
  const left = formatAmount(debt.remaining, debt.currency);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${t('debts.card.total', { amount: total })}, ${t('debts.card.paid')} ${paid}, ${t('debts.card.left')} ${left}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.line}>
        <Text variant="bodyStrong" numberOfLines={2} style={styles.flex}>
          {title}
        </Text>
        {debt.isClosed ? (
          <Badge label={t('debts.closed')} variant="paid" />
        ) : (
          <Text variant="label" muted tabular>
            {t('debts.card.total', { amount: total })}
          </Text>
        )}
      </View>
      <ProgressBar value={debtProgress(debt)} tone={debt.isClosed ? 'success' : 'primary'} />
      <View style={styles.line}>
        <View style={styles.amounts}>
          <Text variant="label" muted tabular>
            {t('debts.card.paid')}{' '}
            <Text variant="label" tabular style={styles.strong}>
              {paid}
            </Text>
          </Text>
          <Text variant="label" muted tabular>
            {t('debts.card.left')}{' '}
            <Text
              variant="label"
              tabular
              style={styles.strong}
              color={debt.remaining > 0 ? colors.text : colors.badges.paid.fg}
            >
              {left}
            </Text>
          </Text>
        </View>
        <OutlineAction label={t('debts.payments')} count={debt.paymentCount} onPress={onPress} />
      </View>
    </Pressable>
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
  pressed: { backgroundColor: c.surface },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1 },
  amounts: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.md, rowGap: 2 },
  strong: { fontWeight: '600' },
}));
