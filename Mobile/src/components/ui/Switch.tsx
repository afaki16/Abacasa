import { Switch as RNSwitch } from 'react-native';

import { useColors } from '@/constants/theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Yanında görünür etiket yoksa zorunlu tut (ekran okuyucu). */
  accessibilityLabel?: string;
}

/** Anahtar (Bilesenler · 4): açıkken ana renk, kapalıyken gri oluk; topuz iki temada da beyaz. */
export function Switch({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) {
  const colors = useColors();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: colors.primary, false: colors.switchOff }}
      thumbColor={colors.switchThumb}
      ios_backgroundColor={colors.switchOff}
    />
  );
}
