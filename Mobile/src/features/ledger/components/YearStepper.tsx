import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles, MIN_TOUCH, Radius, useColors } from '@/constants/theme';

/** Yıl seçici: ‹ 2026 › (sınırlar backend'deki LedgerRules ile aynı). */
export function YearStepper({
  year,
  onChange,
  min = 2000,
  max = 2100,
}: {
  year: number;
  onChange: (year: number) => void;
  min?: number;
  max?: number;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const button = (delta: -1 | 1) => {
    const disabled = delta < 0 ? year <= min : year >= max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={delta < 0 ? t('ledger.previousYear') : t('ledger.nextYear')}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(year + delta)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Icon
          name={delta < 0 ? 'chevron-left' : 'chevron-right'}
          size={24}
          color={disabled ? colors.textDisabled : colors.text}
        />
      </Pressable>
    );
  };
  return (
    <View style={styles.bar}>
      {button(-1)}
      <Text
        variant="bodyStrong"
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        tabular
      >
        {String(year)}
      </Text>
      {button(1)}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 6,
  },
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  pressed: { backgroundColor: c.surface },
}));
