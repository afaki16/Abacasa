import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors, type ColorToken, type ThemeColors } from '@/constants/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/**
 * primary: ana eylem (Kaydet) · secondary: çerçeveli (Vazgeç) · ghost: metin düğmesi (Tümü)
 * destructive: dolu kırmızı (Sil) · danger: çerçevesiz kırmızı metin (Çıkış yap).
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger';

/** md: 52 (form altı) · sm: 48 (onay penceresi, boş durum). ghost her zaman 44. */
type Size = 'md' | 'sm';

const TEXT_COLORS: Record<Variant, ColorToken> = {
  primary: 'onPrimary',
  secondary: 'primarySoftText',
  ghost: 'primary',
  destructive: 'onDanger',
  danger: 'danger',
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  /** Başlığın solunda ikon (ör. add, refresh). */
  icon?: IconName;
  loading?: boolean;
}

/** Genişlik iç boşlukla belirlenir (İngilizce etiketler uzayabilir); tam genişlik için style ile. */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const isDisabled = disabled || loading;
  const filled = variant === 'primary' || variant === 'destructive';
  const textColor = disabled && !loading ? disabledText(variant, colors) : colors[TEXT_COLORS[variant]];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        variant === 'ghost' ? styles.ghostSize : size === 'sm' ? styles.sm : styles.md,
        styles[variant],
        state.pressed && pressedStyle(variant, styles),
        disabled && !loading && (filled ? styles.filledDisabled : styles.outlineDisabled),
        loading && filled && styles.loading,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : icon ? (
          <Icon name={icon} size={20} color={textColor} />
        ) : null}
        <Text color={textColor} style={variant === 'ghost' || size === 'sm' ? styles.labelSm : styles.label}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

function disabledText(variant: Variant, c: ThemeColors) {
  return variant === 'primary' || variant === 'destructive' ? c.onDisabled : c.textDisabled;
}

function pressedStyle(variant: Variant, s: ReturnType<typeof useStyles>) {
  switch (variant) {
    case 'primary':
      return s.primaryPressed;
    case 'secondary':
      return s.secondaryPressed;
    case 'destructive':
      return s.destructivePressed;
    default:
      return s.textPressed;
  }
}

const useStyles = makeStyles((c) => ({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  md: { minHeight: 52, borderRadius: Radius.button },
  sm: { minHeight: 48, borderRadius: Radius.button, paddingHorizontal: Spacing.xl - 4 },
  ghostSize: { minHeight: MIN_TOUCH, borderRadius: 10, paddingHorizontal: Spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  label: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  labelSm: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20, textAlign: 'center' },

  primary: { backgroundColor: c.primary },
  primaryPressed: { backgroundColor: c.primaryPressed },
  secondary: { borderWidth: 1, borderColor: c.primaryOutline, backgroundColor: 'transparent' },
  secondaryPressed: { backgroundColor: c.primarySoft, borderColor: c.primarySoftBorder },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent' },
  textPressed: { backgroundColor: c.iconTile },
  destructive: { backgroundColor: c.dangerSolid },
  destructivePressed: { backgroundColor: c.dangerPressed },

  filledDisabled: { backgroundColor: c.disabledSurface, borderWidth: 0 },
  outlineDisabled: { borderColor: c.border },
  loading: { opacity: 0.85 },
}));
