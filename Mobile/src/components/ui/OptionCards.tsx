import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

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
  useTranslation(); // dil değişince hata metni yeniden çevrilsin
  const styles = useStyles();
  const colors = useColors();

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
      {label ? (
        <Text variant="label" muted>
          {label}
        </Text>
      ) : null}
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
                <Text variant="bodyStrong" color={selected ? colors.primarySoftText : colors.text}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text variant="caption" muted numberOfLines={2}>
                    {option.description}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons
                name={
                  props.multiple
                    ? selected
                      ? 'check-box'
                      : 'check-box-outline-blank'
                    : selected
                      ? 'radio-button-checked'
                      : 'radio-button-unchecked'
                }
                size={22}
                color={selected ? colors.primary : colors.textDisabled}
                accessible={false}
              />
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {translateMessage(error)}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: Spacing.xs },
  list: { gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    minHeight: 52,
  },
  cardSelected: { borderColor: c.primarySoftBorder, backgroundColor: c.primarySoft },
  texts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
}));
