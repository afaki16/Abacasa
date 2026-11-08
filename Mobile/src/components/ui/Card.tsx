import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { Text } from './Text';

export interface CardProps {
  /** Bölüm başlığı (web'deki bölümlü form kartlarıyla aynı yapı). */
  title?: string;
  description?: string;
  children: ReactNode;
  /** Liste satırları kenara dayansın diye iç boşluk kapatılabilir. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, description, children, padded = true, style }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {(title || description) && (
        <View style={[styles.header, !padded && styles.headerUnpadded]}>
          {title ? <Text variant="label">{title}</Text> : null}
          {description ? (
            <Text variant="caption" muted>
              {description}
            </Text>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  padded: { padding: Spacing.lg, gap: Spacing.lg },
  header: { gap: 2 },
  headerUnpadded: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
});
