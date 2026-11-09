import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

export interface SelectFieldProps {
  label: string;
  /** Seçili değerin metni; boşsa yer tutucu. */
  value?: string | null;
  placeholder: string;
  /** Sağdaki ikon (seçim: expand-more · tarih: calendar-month). */
  icon?: IconName;
  /** Doğrulama anahtarı ya da hazır metin. */
  error?: string;
  /** Etiket satırının sağında ek öğe (ör. yemek kartı rozeti). */
  labelRight?: ReactNode;
  onPress: () => void;
}

/**
 * Seçim alanı (form içi): etiket üstte, 52 yükseklikte kutu, dokununca alttan seçim sayfası açılır
 * (SelectSheet / DatePickerSheet). Hata durumunda 2px kırmızı kenar ve mesaj.
 */
export function SelectField({ label, value, placeholder, icon = 'expand-more', error, labelRight, onPress }: SelectFieldProps) {
  useTranslation(); // dil değişince hata metni yeniden çevrilsin
  const styles = useStyles();
  const colors = useColors();
  const message = translateMessage(error);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text variant="label" color={error ? colors.danger : colors.textMuted}>
          {label}
        </Text>
        {labelRight}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityHint={message}
        onPress={onPress}
        style={({ pressed }) => [styles.box, !!error && styles.errorBox, pressed && styles.pressed]}
      >
        <Text color={value ? colors.text : colors.placeholder} style={styles.value} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Icon name={icon} size={22} color={error ? colors.danger : colors.textMuted} />
      </Pressable>
      {message ? (
        <View style={styles.errorRow}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.value}>
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  box: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 14,
  },
  errorBox: { borderWidth: 2, borderColor: c.danger, paddingHorizontal: 13 },
  pressed: { backgroundColor: c.surface },
  value: { flex: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
}));
