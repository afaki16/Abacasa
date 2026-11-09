import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { ProgressBar } from '@/features/recurringPayments/components/form/Bits';
import { enumLabel } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { formatDisplayDate } from '@/lib/format/period';

import { fundProgress } from '../fundForm';
import type { DonationFund } from '../types';

/** Emanet satırı: kimden, tür ve alınma tarihi, elde kalan; dağıtım çubuğu; alınan · dağıtılan. */
export function FundCard({
  fund,
  last,
  onPress,
}: {
  fund: DonationFund;
  last?: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const meta = `${enumLabel('donationKind', fund.kind)} · ${t('donationFunds.receivedOn', { date: formatDisplayDate(fund.date) })}`;
  const foot = t('donationFunds.foot', {
    amount: formatMoney(fund.amount),
    distributed: formatMoney(fund.distributed),
  });

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${fund.fromPersonName}, ${meta}, ${t('donationFunds.onHand')} ${formatMoney(fund.onHand)}, ${foot}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.line}>
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {fund.fromPersonName}
          </Text>
          <Text variant="caption" muted>
            {meta}
          </Text>
        </View>
        <View style={styles.right}>
          {fund.isClosed ? (
            <Badge label={t('donationFunds.closed')} variant="neutral" />
          ) : (
            <Text variant="caption" muted>
              {t('donationFunds.onHand')}
            </Text>
          )}
          <Text tabular style={styles.amount}>
            {formatMoney(fund.onHand)}
          </Text>
        </View>
      </View>
      <ProgressBar value={fundProgress(fund)} tone="primary" />
      <Text variant="caption" muted tabular>
        {foot}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: { gap: Spacing.sm, paddingVertical: Spacing.md, paddingHorizontal: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: c.border },
  pressed: { backgroundColor: c.surface },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontWeight: '700', fontSize: 16, lineHeight: 22, textAlign: 'right' },
}));
