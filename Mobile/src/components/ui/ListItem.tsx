import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { Text } from './Text';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Sağ tarafta ok yerine gösterilecek öğe (rozet, buton…). */
  trailing?: ReactNode;
  destructive?: boolean;
  /** Kartın son satırında alt çizgiyi gizler. */
  last?: boolean;
  onPress?: () => void;
}

/** Kart içinde menü / liste satırı. onPress varsa basılabilir ve sağda ok gösterir. */
export function ListItem({ title, subtitle, icon, trailing, destructive, last, onPress }: ListItemProps) {
  const color = destructive ? Colors.danger : Colors.text;

  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      {icon ? <Ionicons name={icon} size={20} color={destructive ? Colors.danger : Colors.textMuted} /> : null}
      <View style={styles.texts}>
        <Text color={color}>{title}</Text>
        {subtitle ? (
          <Text variant="caption" muted numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.textDisabled} /> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  texts: { flex: 1, gap: 2 },
  pressed: { backgroundColor: Colors.surface },
});
