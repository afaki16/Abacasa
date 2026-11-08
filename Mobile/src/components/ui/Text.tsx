import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { fontFamilyFor, makeStyles, Typography, type TypographyVariant } from '@/constants/theme';

/**
 * Yazı ölçeği (Bilesenler · 2). Eski adlar geriye uyum için durur:
 * heading → h1, title → h2.
 */
type Variant = TypographyVariant | 'heading' | 'title';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
  /** Tutarlar: rakamlar eşit genişlikte (alt alta hizalı). */
  tabular?: boolean;
}

const ALIASES: Record<'heading' | 'title', TypographyVariant> = { heading: 'h1', title: 'h2' };

/**
 * RN Text yerine her yerde bunu kullan — tipografi tek yerden yönetilir.
 * Stilde fontWeight verilirse karşılık gelen Inter dosyasına çevrilir (Android'de fontWeight
 * özel fontta işe yaramaz).
 */
export function Text({ variant = 'body', muted, color, tabular, style, ...rest }: TextProps) {
  const styles = useStyles();
  const resolved = variant === 'heading' || variant === 'title' ? ALIASES[variant] : variant;
  const flat = StyleSheet.flatten([
    styles.base,
    styles[resolved],
    muted && styles.muted,
    color ? { color } : null,
    tabular && TABULAR,
    style,
  ]) as TextStyle;

  if (flat.fontWeight !== undefined) {
    const { fontWeight, ...restStyle } = flat;
    return <RNText style={{ ...restStyle, fontFamily: fontFamilyFor(fontWeight) }} {...rest} />;
  }
  return <RNText style={flat} {...rest} />;
}

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

const useStyles = makeStyles((c) => ({
  base: { color: c.text },
  ...Typography,
  muted: { color: c.textMuted },
}));
