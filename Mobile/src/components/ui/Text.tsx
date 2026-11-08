import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { Colors, FontSize } from '@/constants/theme';

type Variant = 'heading' | 'title' | 'body' | 'label' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}

/** RN Text yerine her yerde bunu kullan — tipografi tek yerden yönetilir. */
export function Text({ variant = 'body', muted, color, style, ...rest }: TextProps) {
  return (
    <RNText
      style={[styles.base, styles[variant], muted && styles.muted, color ? { color } : null, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: Colors.text, fontSize: FontSize.body },
  heading: { fontSize: FontSize.heading, fontWeight: '700' },
  title: { fontSize: FontSize.title, fontWeight: '600' },
  body: { fontSize: FontSize.body },
  label: { fontSize: FontSize.label, fontWeight: '500' },
  caption: { fontSize: FontSize.caption },
  muted: { color: Colors.textMuted },
});
