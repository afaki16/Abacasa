import { Pressable, View } from 'react-native';

import { makeStyles, Radius, Spacing } from '@/constants/theme';

import { Switch } from './Switch';
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
  const styles = useStyles();

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
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" muted>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    backgroundColor: c.card,
  },
  texts: { flex: 1, gap: 2 },
  pressed: { backgroundColor: c.surface },
  disabled: { opacity: 0.5 },
}));
