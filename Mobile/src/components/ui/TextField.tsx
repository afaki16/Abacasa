import { useState, type ComponentRef, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View, type TextInputProps } from 'react-native';

import { FontFamily, FontSize, makeStyles, Radius, Spacing, useColorSchemeName, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

import { Icon } from './Icon';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  /** Alanın ÜSTÜNDE gösterilen etiket (web form standardıyla aynı). */
  label: string;
  /** Doğrulama anahtarı (validation.*) ya da hazır metin; anahtar gösterimde çevrilir. */
  error?: string;
  hint?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/** Metin alanı (Bilesenler · 4): varsayılan, odakta (2px ana renk), hatalı (2px kırmızı + ikon), salt okunur. */
export function TextField({ label, error, hint, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  useTranslation(); // dil değişince hata metni yeniden çevrilsin
  const styles = useStyles();
  const colors = useColors();
  const scheme = useColorSchemeName();
  const [focused, setFocused] = useState(false);
  const readOnly = rest.editable === false;

  return (
    <View style={styles.container}>
      <Text variant="label" color={error ? colors.danger : colors.textMuted}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ? translateMessage(error) : undefined}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        keyboardAppearance={scheme}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          readOnly && styles.inputReadOnly,
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.errorText}>
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
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    // Odakta kenar 2px olur; iç boşluk 1px azalır ki metin kaymasın.
    paddingHorizontal: 14,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.input,
    color: c.text,
    backgroundColor: c.card,
  },
  inputFocused: { borderWidth: 2, borderColor: c.borderFocus, paddingHorizontal: 13 },
  inputError: { borderWidth: 2, borderColor: c.danger, paddingHorizontal: 13 },
  inputReadOnly: { backgroundColor: c.surface, borderColor: c.border, color: c.textMuted },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  errorText: { flex: 1 },
}));
