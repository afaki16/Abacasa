import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { FontFamily, makeStyles, Radius, useColors, useColorSchemeName } from '@/constants/theme';
import { formatAmountInput, nextAmountInput } from '@/lib/format/amountInput';

/**
 * Aylık tutar hücresi (tasarım: Gelir kalemi · Aylık tutarlar): solda ay adı, sağda TL tutarı.
 * Ham değer AmountField ile aynı kurallarla yazılır ("52000,5"); boş = girilmemiş.
 */
export function MonthAmountCell({
  label,
  accessibilityLabel,
  value,
  onChangeValue,
  editable = true,
}: {
  label: string;
  accessibilityLabel: string;
  value: string;
  onChangeValue: (raw: string) => void;
  editable?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const scheme = useColorSchemeName();
  const [focused, setFocused] = useState(false);
  const display = formatAmountInput(value, 'TRY');

  return (
    <View style={[styles.cell, focused && styles.focused, !editable && styles.readOnly]}>
      <Text variant="label" muted>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={display}
        editable={editable}
        onChangeText={(text) => onChangeValue(nextAmountInput(value, text, 'TRY'))}
        keyboardType="decimal-pad"
        keyboardAppearance={scheme}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        placeholder="—"
        placeholderTextColor={colors.placeholder}
        selection={{ start: display.length, end: display.length }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  cell: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: 10,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 4,
  },
  focused: { borderWidth: 2, borderColor: c.borderFocus, paddingLeft: 11 },
  readOnly: { backgroundColor: c.surface, borderRadius: Radius.sm + 2 },
  input: {
    flex: 1,
    minHeight: 42,
    paddingRight: 12,
    textAlign: 'right',
    fontFamily: FontFamily.medium,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: c.text,
  },
}));
