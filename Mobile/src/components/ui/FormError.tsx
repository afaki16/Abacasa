import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

import { Text } from './Text';

/**
 * Form üstü hata bandı. messages boşsa hiçbir şey çizmez.
 * Doğrulama anahtarları (validation.*) gösterimde çevrilir; backend mesajları olduğu gibi kalır.
 */
export function FormError({ messages }: { messages?: string[] }) {
  useTranslation(); // dil değişince yeniden çiz
  const styles = useStyles();
  const colors = useColors();
  if (!messages?.length) return null;
  return (
    <View accessibilityRole="alert" style={styles.container}>
      {messages.map((message) => (
        <Text key={message} variant="label" color={colors.danger}>
          {translateMessage(message)}
        </Text>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: c.dangerSurface,
  },
}));
