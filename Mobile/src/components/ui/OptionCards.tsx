import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { Text } from './Text';

export interface Option<V extends string | number> {
  value: V;
  label: string;
  description?: string;
}

interface BaseProps<V extends string | number> {
  label?: string;
  options: Option<V>[];
  error?: string;
  disabled?: boolean;
}

interface SingleProps<V extends string | number> extends BaseProps<V> {
  multiple?: false;
  value: V | null | undefined;
  onChange: (value: V) => void;
}

interface MultiProps<V extends string | number> extends BaseProps<V> {
  multiple: true;
  value: V[];
  onChange: (value: V[]) => void;
}

export type OptionCardsProps<V extends string | number> = SingleProps<V> | MultiProps<V>;

/**
 * Kart seçici (web'deki "kart seçici"nin karşılığı): az sayıda seçenek için select yerine
 * dokunulabilir kartlar. `multiple` ile çoklu seçim (ör. roller).
 */
export function OptionCards<V extends string | number>(props: OptionCardsProps<V>) {
  const { label, options, error, disabled } = props;

  const isSelected = (v: V) => (props.multiple ? props.value.includes(v) : props.value === v);

  const toggle = (v: V) => {
    if (props.multiple) {
      props.onChange(isSelected(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else {
      props.onChange(v);
    }
  };

  return (
    <View style={styles.container}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={styles.list}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => toggle(option.value)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.pressed,
                disabled && styles.disabled,
              ]}
            >
              <View style={styles.texts}>
                <Text variant="label" color={selected ? Colors.primary : Colors.text}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text variant="caption" muted numberOfLines={2}>
                    {option.description}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name={
                  props.multiple
                    ? selected
                      ? 'checkbox'
                      : 'square-outline'
                    : selected
                      ? 'radio-button-on'
                      : 'radio-button-off'
                }
                size={22}
                color={selected ? Colors.primary : Colors.textDisabled}
              />
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text variant="caption" color={Colors.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  list: { gap: Spacing.sm },
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
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  texts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
