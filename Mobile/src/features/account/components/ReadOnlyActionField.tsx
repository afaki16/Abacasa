import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { FontFamily, FontSize, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';

export interface ReadOnlyActionFieldProps {
  label: string;
  value: string;
  /** Alanın sağındaki metin eylemi ("Değiştir"). */
  actionLabel?: string;
  onAction?: () => void;
}

/** Salt okunur alan + sağda metin eylemi (Profil · E-posta "Değiştir"). Etiket alanın üstünde. */
export function ReadOnlyActionField({ label, value, actionLabel, onAction }: ReadOnlyActionFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Text variant="label" muted>
        {label}
      </Text>
      <View style={styles.field}>
        <Text color={colors.textMuted} style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${actionLabel}`}
            onPress={onAction}
            hitSlop={{ top: 4, bottom: 4 }}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text color={colors.primary} style={styles.actionText}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: 6 },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.md,
    backgroundColor: c.surface,
    paddingLeft: 14,
    paddingRight: Spacing.xs,
  },
  value: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.input },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 10 },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 13 },
  pressed: { opacity: 0.6 },
}));
