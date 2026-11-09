import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName, Text } from '@/components/ui';
import { FontFamily, FontSize, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

export interface PickerFieldProps {
  /** Alanın ÜSTÜNDEKİ etiket. */
  label: string;
  /** Seçili değerin metni; boşsa yer tutucu gösterilir. */
  value?: string | null;
  placeholder?: string;
  /** Sağdaki ikon (seçim: expand-more, tarih: calendar-month). */
  icon?: IconName;
  onPress?: () => void;
  /** Doğrulama anahtarı ya da hazır metin. */
  error?: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * Seçim alanı (Bilesenler · 4'teki seçici görünümü): TextField ile aynı kutu, dokununca alttan sayfa
 * (SelectSheet / DatePickerSheet) açılır. Kitte karşılığı olmadığı için planlama modüllerinde ortak.
 */
export function PickerField({
  label,
  value,
  placeholder,
  icon = 'expand-more',
  onPress,
  error,
  hint,
  disabled,
}: PickerFieldProps) {
  useTranslation(); // dil değişince hata metni yeniden çevrilsin
  const styles = useStyles();
  const colors = useColors();
  const empty = !value;

  return (
    <View style={styles.container}>
      <Text variant="label" color={error ? colors.danger : colors.textMuted}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder || ''}`}
        accessibilityHint={error ? translateMessage(error) : undefined}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled || !onPress}
        onPress={onPress}
        style={({ pressed }) => [
          styles.box,
          !!error && styles.boxError,
          disabled && styles.boxReadOnly,
          pressed && styles.pressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={styles.value}
          color={empty ? colors.placeholder : disabled ? colors.textMuted : colors.text}
        >
          {value || placeholder || ''}
        </Text>
        {!disabled ? <Icon name={icon} size={20} color={colors.textMuted} /> : null}
      </Pressable>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.flex}>
            {translateMessage(error)}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: 6 },
  box: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  boxError: { borderWidth: 2, borderColor: c.danger, paddingHorizontal: 13 },
  boxReadOnly: { backgroundColor: c.surface, borderColor: c.border },
  pressed: { backgroundColor: c.surface },
  value: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.input },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  flex: { flex: 1 },
}));
