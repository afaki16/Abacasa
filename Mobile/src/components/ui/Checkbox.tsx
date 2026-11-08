import { Pressable, View } from 'react-native';

import { makeStyles, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Onay kutusu (Bilesenler · 4): 22×22 kutu + etiket; tüm satır dokunulabilir. */
export function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Icon name="check" size={18} color={colors.onPrimary} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: MIN_TOUCH },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: c.primary, borderColor: c.primary },
  label: { flex: 1, paddingVertical: Spacing.xs },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
}));
