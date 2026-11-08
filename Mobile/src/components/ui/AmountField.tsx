import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { FontFamily, makeStyles, Radius, Spacing, Typography, useColorSchemeName, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';
import type { Currency } from '@/lib/domain/enums';
import { amountSymbol, formatAmountInput, nextAmountInput } from '@/lib/format/amountInput';

import { Chip } from './Chip';
import { Icon } from './Icon';
import { Text } from './Text';

export interface AmountFieldProps {
  /** Ham değer ("1234,5"); sayıya parseAmountInput ile çevrilir. */
  value: string;
  onChangeValue: (raw: string) => void;
  currency: Currency;
  /** Para birimi çipine dokununca (CurrencyPickerSheet açılır). Verilmezse çip salt gösterim. */
  onCurrencyPress?: () => void;
  /** Ekran okuyucu etiketi; verilmezse "Tutar". */
  label?: string;
  error?: string;
  /**
   * hero: ekranın üstünde büyük tutar (44/700) + para birimi çipi — hızlı giriş.
   * inline: form içinde 56 yükseklikte sağa hizalı tutar + para birimi kutusu.
   */
  variant?: 'hero' | 'inline';
  autoFocus?: boolean;
}

/**
 * Tutar alanı (Bilesenler · 4). Sayısal klavye açılır; değer yazarken tr-TR biçiminde gruplanır,
 * rakamlar eşit genişlikte. Çeyrek altında yalnızca tam sayı girilir.
 */
export function AmountField({
  value,
  onChangeValue,
  currency,
  onCurrencyPress,
  label,
  error,
  variant = 'hero',
  autoFocus,
}: AmountFieldProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const scheme = useColorSchemeName();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(!!autoFocus);
  const display = formatAmountInput(value, currency);
  const a11yLabel = label ?? t('ui.amount.label');
  const currencyShort = t(`ui.currency.short.${currency}`);
  const whole = currency === 'QuarterGold';

  const input = (
    <TextInput
      ref={inputRef}
      accessibilityLabel={a11yLabel}
      accessibilityHint={error ? translateMessage(error) : undefined}
      value={display}
      onChangeText={(text) => onChangeValue(nextAmountInput(value, text, currency))}
      keyboardType={whole ? 'number-pad' : 'decimal-pad'}
      keyboardAppearance={scheme}
      selectionColor={colors.primary}
      cursorColor={colors.primary}
      autoFocus={autoFocus}
      placeholder={`${amountSymbol(currency)}0`}
      placeholderTextColor={colors.placeholder}
      selection={{ start: display.length, end: display.length }}
      contextMenuHidden={variant === 'hero'}
      caretHidden={variant === 'hero'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={variant === 'hero' ? styles.hiddenInput : styles.inlineInput}
    />
  );

  const currencyControl =
    variant === 'hero' ? (
      <Chip
        label={currencyShort}
        selected
        chevron={!!onCurrencyPress}
        onPress={onCurrencyPress}
        accessibilityLabel={t('ui.currency.change', { currency: t(`enums.currency.${currency}`) })}
      />
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ui.currency.change', { currency: t(`enums.currency.${currency}`) })}
        disabled={!onCurrencyPress}
        onPress={onCurrencyPress}
        style={({ pressed }) => [styles.currencyBox, pressed && styles.pressed]}
      >
        <Text style={styles.currencyText}>{currencyShort}</Text>
        {onCurrencyPress ? <Icon name="expand-more" size={20} /> : null}
      </Pressable>
    );

  return (
    <View style={styles.container}>
      {variant === 'hero' ? (
        <View style={styles.heroRow}>
          {/* Görünen tutar + kendi imleci; gerçek giriş (görünmez) bunun üstünde dokunmayı alır. */}
          <View style={styles.heroAmount}>
            <View style={styles.heroDisplay} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Text
                variant="amountLarge"
                color={display ? colors.text : colors.placeholder}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {display || `${amountSymbol(currency)}0`}
              </Text>
              {focused ? <View style={styles.caret} /> : null}
            </View>
            {input}
          </View>
          {currencyControl}
        </View>
      ) : (
        <View style={styles.inlineRow}>
          <View style={[styles.inlineBox, focused && styles.focused, !!error && styles.errorBorder]}>{input}</View>
          {currencyControl}
        </View>
      )}
      {error ? (
        <View style={[styles.errorRow, variant === 'hero' && styles.centered]}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger}>
            {translateMessage(error)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: Spacing.xs },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: Spacing.sm },
  heroAmount: { flexShrink: 1, minHeight: 52, justifyContent: 'center' },
  heroDisplay: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  caret: { width: 2, height: 40, backgroundColor: c.primary },
  // Gerçek giriş görünmez; dokunma ve klavye için tutarın üstünde durur.
  hiddenInput: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0, color: 'transparent' },
  inlineRow: { flexDirection: 'row', gap: Spacing.sm },
  inlineBox: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    justifyContent: 'center',
  },
  inlineInput: {
    ...Typography.h2,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    color: c.text,
    textAlign: 'right',
    paddingHorizontal: 14,
    minHeight: 54,
  },
  focused: { borderWidth: 2, borderColor: c.borderFocus },
  errorBorder: { borderWidth: 2, borderColor: c.danger },
  currencyBox: {
    width: 84,
    minHeight: 56,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: { fontFamily: FontFamily.semibold, fontSize: 15 },
  pressed: { backgroundColor: c.surface },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  centered: { justifyContent: 'center' },
}));
