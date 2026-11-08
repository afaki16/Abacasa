import { Pressable } from 'react-native';

import { FontFamily, makeStyles, Radius, useColors } from '@/constants/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: IconName;
  /** Sağda açılır ok (ör. para birimi çipi). */
  chevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Çip (Bilesenler · 4): filtre, hızlı seçim (Bugün/Dün), para birimi. 40 yükseklik + dokunma payı. */
export function Chip({ label, selected, icon, chevron, onPress, disabled, accessibilityLabel }: ChipProps) {
  const styles = useStyles();
  const colors = useColors();
  const fg = selected ? colors.primarySoftText : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected, disabled }}
      disabled={disabled || !onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        chevron && styles.withChevron,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text color={fg} style={styles.label}>
        {label}
      </Text>
      {chevron ? <Icon name="expand-more" size={20} color={fg} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
  },
  withChevron: { paddingRight: 8 },
  selected: { borderColor: c.primarySoftBorder, backgroundColor: c.primarySoft },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
}));
