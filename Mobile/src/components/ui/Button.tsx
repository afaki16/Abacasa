import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { Text } from './Text';

/** danger: yıkıcı işlemler (sil, hesabı kapat) — çerçevesiz kırmızı yazı. */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const TEXT_COLORS: Record<Variant, string> = {
  primary: Colors.onPrimary,
  secondary: Colors.primary,
  ghost: Colors.primary,
  danger: Colors.danger,
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const textColor = TEXT_COLORS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && variant === 'primary' && styles.primaryPressed,
        state.pressed && variant !== 'primary' && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text variant="label" color={textColor}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.primary },
  primaryPressed: { backgroundColor: Colors.primaryPressed },
  secondary: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
