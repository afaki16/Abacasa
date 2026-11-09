import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColorSchemeName, useColors } from '@/constants/theme';

import { sanitizeOtp } from '../passwordRules';
import { translateMessage } from '../validation';

const LENGTH = 6;

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Doğrulama anahtarı ya da hazır metin. */
  error?: string;
  autoFocus?: boolean;
  /** 6. hane girilince. */
  onComplete?: (code: string) => void;
}

/**
 * 6 haneli kod: altı kutu, tek gizli metin alanı (SMS/e-posta kodu otomatik doldurma ve yapıştırma çalışır).
 * Sıradaki kutu odakta ana renk kenarlıklı.
 */
export function OtpInput({ value, onChange, error, autoFocus, onComplete }: OtpInputProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const scheme = useColorSchemeName();
  const styles = useStyles();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, LENGTH - 1);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => input.current?.focus()}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={styles.row}
      >
        {Array.from({ length: LENGTH }, (_, i) => (
          <View
            key={i}
            style={[
              styles.box,
              focused && i === active && styles.boxActive,
              !!error && styles.boxError,
            ]}
          >
            <Text style={styles.digit} tabular>
              {value[i] ?? ''}
            </Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={input}
        testID="otp-input"
        value={value}
        onChangeText={(text) => {
          const code = sanitizeOtp(text);
          onChange(code);
          if (code.length === LENGTH) onComplete?.(code);
        }}
        accessibilityLabel={t('authScreens.otp.label')}
        accessibilityHint={error ? translateMessage(error) : undefined}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        keyboardAppearance={scheme}
        maxLength={LENGTH}
        autoFocus={autoFocus}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hidden}
      />
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.errorText}>
            {translateMessage(error)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
  box: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderWidth: 2, borderColor: c.borderFocus },
  boxError: { borderColor: c.danger },
  digit: { fontFamily: FontFamily.semibold, fontSize: 24, lineHeight: 30 },
  // Kutuların üstünde, görünmez: dokunma ve klavye bu alana gider.
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, opacity: 0.02, color: 'transparent' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  errorText: { flex: 1 },
}));
