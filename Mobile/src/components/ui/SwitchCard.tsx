import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { Text } from './Text';

export interface SwitchCardProps {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/** Switch kartı (web'deki "switch kartı"): açıklamalı açık/kapalı ayarı. Tüm kart dokunulabilir. */
export function SwitchCard({ title, description, value, onChange, disabled }: SwitchCardProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.texts}>
        <Text variant="label">{title}</Text>
        {description ? (
          <Text variant="caption" muted>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: Colors.primary, false: Colors.border }}
        thumbColor={Colors.background}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  texts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
