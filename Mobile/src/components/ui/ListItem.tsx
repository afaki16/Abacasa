import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /**
   * menu: kart içi menü satırı (ana renkte çıplak ikon, 48 yükseklik — Diğer sekmesi).
   * record: kayıt satırı (40×40 ikon kutusu, kalın başlık, 68 yükseklik — harcama listesi).
   */
  kind?: 'menu' | 'record';
  /** Sağda tutar (kalın, eşit genişlikte rakamlar, sağa hizalı). */
  amount?: string;
  /** Tutarın altında küçük ikincil satır (ör. "₺760,00 bekleyen"). */
  amountCaption?: string;
  /** Sağda ok yerine gösterilecek öğe (rozet, buton…). */
  trailing?: ReactNode;
  destructive?: boolean;
  /** Kartın son satırında alt çizgiyi gizler. */
  last?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}

/** Kart içinde menü / kayıt satırı. onPress varsa basılabilir ve (tutar yoksa) sağda ok gösterir. */
export function ListItem({
  title,
  subtitle,
  icon,
  kind = 'menu',
  amount,
  amountCaption,
  trailing,
  destructive,
  last,
  onPress,
  accessibilityHint,
}: ListItemProps) {
  const styles = useStyles();
  const colors = useColors();
  const record = kind === 'record';
  const color = destructive ? colors.danger : colors.text;

  const content = (
    <View style={[styles.row, record && styles.recordRow, !last && styles.divider]}>
      {icon ? (
        record ? (
          <View style={styles.tile}>
            <Icon name={icon} size={22} color={colors.iconTileText} />
          </View>
        ) : (
          <Icon name={icon} size={22} color={destructive ? colors.danger : colors.primary} />
        )
      ) : null}
      <View style={styles.texts}>
        <Text variant={record ? 'bodyStrong' : 'body'} color={color} style={!record && styles.menuTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {amount !== undefined ? (
        <View style={styles.amount}>
          <Text variant="bodyStrong" tabular style={styles.right}>
            {amount}
          </Text>
          {amountCaption ? (
            <Text variant="caption" muted tabular style={styles.right}>
              {amountCaption}
            </Text>
          ) : null}
        </View>
      ) : null}
      {trailing ??
        (onPress && amount === undefined ? <Icon name="chevron-right" size={20} color={colors.textDisabled} /> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, amount].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
  },
  recordRow: { minHeight: 68, paddingHorizontal: 20 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  tile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 3 },
  menuTitle: { fontFamily: FontFamily.medium },
  amount: { alignItems: 'flex-end', gap: 2 },
  right: { textAlign: 'right' },
  pressed: { backgroundColor: c.surface },
}));
