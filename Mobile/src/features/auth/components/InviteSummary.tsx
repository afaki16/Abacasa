import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing } from '@/constants/theme';

export interface InviteSummaryRow {
  label: string;
  /** Metin ya da öğe (ör. rol rozeti). */
  value: ReactNode;
  /** value öğe ise ekran okuyucu için metin karşılığı. */
  accessibilityValue?: string;
}

/** Davet özeti kartı: etiket solda, değer sağda; satırlar ince çizgiyle ayrılır. */
export function InviteSummary({ rows }: { rows: InviteSummaryRow[] }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <View
          key={row.label}
          style={[styles.row, i > 0 && styles.divider]}
          accessible
          accessibilityLabel={`${row.label}: ${row.accessibilityValue ?? (typeof row.value === 'string' ? row.value : '')}`}
        >
          <Text variant="label" muted style={styles.label}>
            {row.label}
          </Text>
          {typeof row.value === 'string' ? (
            <Text style={styles.value} numberOfLines={2}>
              {row.value}
            </Text>
          ) : (
            row.value
          )}
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
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  divider: { borderTopWidth: 1, borderTopColor: c.border },
  label: { fontSize: 14 },
  value: { flexShrink: 1, textAlign: 'right', fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
}));
