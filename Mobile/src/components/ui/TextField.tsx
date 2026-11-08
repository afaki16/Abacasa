import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  /** Alanın ÜSTÜNDE gösterilen etiket (web form standardıyla aynı). */
  label: string;
  error?: string;
  hint?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({ label, error, hint, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={Colors.textDisabled}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          rest.editable === false && styles.inputDisabled,
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
        <Text variant="caption" color={Colors.danger}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputFocused: { borderColor: Colors.borderFocus },
  inputError: { borderColor: Colors.danger },
  inputDisabled: { backgroundColor: Colors.surface, color: Colors.textMuted },
});
