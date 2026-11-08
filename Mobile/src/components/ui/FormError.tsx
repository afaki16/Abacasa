import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { Text } from './Text';

/** Form üstü hata bandı. messages boşsa hiçbir şey çizmez. */
export function FormError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <View accessibilityRole="alert" style={styles.container}>
      {messages.map((message) => (
        <Text key={message} variant="label" color={Colors.danger}>
          {message}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerSurface,
  },
});
