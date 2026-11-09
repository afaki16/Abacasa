import { View } from 'react-native';

import { Text } from '@/components/ui';
import { makeStyles, Radius } from '@/constants/theme';
import { ProgressBar } from '@/features/recurringPayments/components/form/Bits';
import { formatMoney } from '@/lib/format/money';

import { type BreakdownRow, percentText } from '../summary';

/** Türe / verene göre kırılım kartı: ad, pay yüzdesi, tutar ve turkuaz çubuk. */
export function BreakdownCard({ rows }: { rows: BreakdownRow[] }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <View
          key={row.key}
          accessible
          accessibilityLabel={`${row.label}, ${percentText(row.share)}, ${formatMoney(row.total)}`}
          style={[styles.row, i > 0 && styles.divider]}
        >
          <View style={styles.line}>
            <Text style={styles.name} numberOfLines={1}>
              {row.label}
            </Text>
            <Text variant="label" muted tabular>
              {percentText(row.share)}
            </Text>
            <Text variant="bodyStrong" tabular style={styles.amount}>
              {formatMoney(row.total)}
            </Text>
          </View>
          <ProgressBar value={row.share} />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: { gap: 7, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontWeight: '500' },
  amount: { minWidth: 96, textAlign: 'right' },
}));
