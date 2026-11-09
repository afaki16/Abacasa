import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { formatMoney } from '@/lib/format/money';

import type { BreakdownRow } from '../breakdown';

export interface BreakdownListRow extends BreakdownRow {
  icon: IconName;
  /** Adın altında küçük satır (ör. "₺760,00 bekleyen"). */
  caption?: string;
}

export interface BreakdownListProps {
  rows: BreakdownListRow[];
  /** Boşken gösterilecek metin. */
  emptyText: string;
}

/** Kırılım listesi (Özet, Kategoriye göre): ikon, ad, yüzde, tutar ve oran çubuğu. */
export function BreakdownList({ rows, emptyText }: BreakdownListProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();

  if (rows.length === 0) {
    return (
      <View style={styles.card}>
        <Text muted style={styles.empty}>
          {emptyText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <View
          key={row.key}
          accessible
          accessibilityLabel={t('summary.breakdown.rowLabel', {
            name: row.label,
            amount: formatMoney(row.amount),
            percent: row.percent,
          })}
          style={[styles.row, index > 0 && styles.divider]}
        >
          <View style={styles.line}>
            <Icon name={row.icon} size={20} color={colors.primary} />
            <View style={styles.texts}>
              <Text style={styles.name} numberOfLines={1}>
                {row.label}
              </Text>
              {row.caption ? (
                <Text variant="caption" muted numberOfLines={1}>
                  {row.caption}
                </Text>
              ) : null}
            </View>
            <Text variant="label" muted tabular>
              {row.percent}
            </Text>
            <Text variant="bodyStrong" tabular style={styles.amount} numberOfLines={1}>
              {formatMoney(row.amount)}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${row.share * 100}%` }]} />
          </View>
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
    paddingVertical: Spacing.xs,
  },
  row: { gap: 7, paddingVertical: 11 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texts: { flex: 1, minWidth: 0 },
  name: { fontFamily: FontFamily.medium },
  amount: { minWidth: 96, textAlign: 'right' },
  track: { height: 6, borderRadius: 3, backgroundColor: c.iconTile, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: c.primary },
  empty: { paddingVertical: Spacing.lg, textAlign: 'center' },
}));
