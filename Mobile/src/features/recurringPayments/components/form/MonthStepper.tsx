import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, useColors } from '@/constants/theme';
import { addMonths, monthName } from '@/lib/format/period';

export interface MonthStepperProps {
  year: number;
  month: number;
  onChange: (value: { year: number; month: number }) => void;
  /** card: beyaz kutu (dönem seçici) · field: form alanı kenarlığı. */
  variant?: 'card' | 'field';
  disabled?: boolean;
}

/** Ay seçici: ‹ Kasım 2026 › (Sabit ödemeler dönem seçici, plan formunda başlangıç ayı). */
export function MonthStepper({
  year,
  month,
  onChange,
  variant = 'card',
  disabled,
}: MonthStepperProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const label = `${monthName(month)} ${year}`;
  const step = (n: number) => onChange(addMonths(year, month, n));

  return (
    <View
      style={[
        styles.row,
        variant === 'field' ? styles.field : styles.card,
        disabled && styles.disabled,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ui.datePicker.previousMonth')}
        disabled={disabled}
        onPress={() => step(-1)}
        style={({ pressed }) => [styles.nav, pressed && styles.pressed]}
      >
        <Icon name="chevron-left" size={24} color={disabled ? colors.textDisabled : colors.text} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.label}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ui.datePicker.nextMonth')}
        disabled={disabled}
        onPress={() => step(1)}
        style={({ pressed }) => [styles.nav, pressed && styles.pressed]}
      >
        <Icon name="chevron-right" size={24} color={disabled ? colors.textDisabled : colors.text} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    minHeight: 52,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
  },
  field: {
    minHeight: 52,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
  },
  disabled: { backgroundColor: c.surface, borderColor: c.border },
  nav: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  pressed: { backgroundColor: c.iconTile },
  label: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22 },
}));
