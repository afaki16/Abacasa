import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface SummaryStat {
  label: string;
  value: string;
}

export interface SummaryCardProps {
  /** Üst etiket ("Dönem toplamı"). */
  label: string;
  /** Ana tutar ("₺48.250,40"). */
  amount: string;
  /** Tutarın altında yabancı birimler ("$320,00 · 2 çeyrek"). */
  caption?: string;
  /** Çizginin altında 2–3 sütun kırılım (Harcama / Bağış / Bekleyen). */
  stats?: SummaryStat[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Ana renk dolgulu özet kartı (Bilesenler · 5, Özet üstü). Koyu temada koyu mavi (summaryCard).
 * Ekranda bir tane olur; yanındaki kartlar StatCard.
 */
export function SummaryCard({ label, amount, caption, stats, style }: SummaryCardProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View accessible accessibilityLabel={[label, amount, caption].filter(Boolean).join(', ')} style={[styles.card, style]}>
      <Text color={colors.summaryCardMuted} style={styles.label}>
        {label}
      </Text>
      <Text color={colors.onSummaryCard} tabular style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </Text>
      {caption ? (
        <Text color={colors.summaryCardMuted} tabular style={styles.label}>
          {caption}
        </Text>
      ) : null}
      {stats?.length ? (
        <>
          <View style={styles.divider} />
          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text color={colors.summaryCardMuted} variant="caption">
                  {s.label}
                </Text>
                <Text color={colors.onSummaryCard} tabular style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

export interface StatCardProps {
  icon: IconName;
  title: string;
  /** teal: ikinci bilgi rengi (Sabit ödemeler) · primary: ana renk (Açık borç). */
  accent?: 'teal' | 'primary';
  /** Büyük değer (ör. açık borç tutarı). */
  value?: string;
  /** Değerin altındaki açıklama. */
  caption?: string;
  /** 0–1 arası ilerleme; verilirse çubuk çizilir. */
  progress?: number;
  /** Çubuğun altındaki iki uç bilgi (Ödenen ₺… / Bekleyen ₺…). */
  footer?: [string, string];
  /** Ek içerik (uyarı satırı vb.). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Beyaz kart + turkuaz/ana renk vurgulu ikon, isteğe bağlı ilerleme çubuğu (Bilesenler · 5). */
export function StatCard({ icon, title, accent = 'teal', value, caption, progress, footer, children, style }: StatCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const accentColor = accent === 'teal' ? colors.tealText : colors.primary;
  const fill = accent === 'teal' ? colors.teal : colors.primary;
  const track = accent === 'teal' ? colors.tealSoft : colors.primarySoft;
  const pct = progress === undefined ? undefined : Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.titleRow}>
        <Icon name={icon} size={20} color={accentColor} />
        <Text style={styles.statTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>
      {value ? (
        <Text tabular style={styles.statBig} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      ) : null}
      {caption ? (
        <Text variant="caption" muted>
          {caption}
        </Text>
      ) : null}
      {pct !== undefined ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
          style={[styles.track, { backgroundColor: track }]}
        >
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
        </View>
      ) : null}
      {footer ? (
        <View style={styles.footer}>
          <Text variant="label" muted tabular>
            {footer[0]}
          </Text>
          <Text variant="label" muted tabular style={styles.right}>
            {footer[1]}
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.summaryCard, borderRadius: Radius.xl, padding: 18, paddingBottom: Spacing.lg, gap: Spacing.xs },
  label: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 20 },
  amount: { fontFamily: FontFamily.bold, fontSize: 34, lineHeight: 42, letterSpacing: -0.3 },
  divider: { height: 1, backgroundColor: c.summaryCardDivider, marginTop: 10, marginBottom: Spacing.sm },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, gap: 2 },
  statValue: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },

  statCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: Spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statTitle: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18 },
  statBig: { fontFamily: FontFamily.bold, fontSize: 19, lineHeight: 24 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  right: { textAlign: 'right' },
}));
