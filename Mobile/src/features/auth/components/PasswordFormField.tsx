import { useState } from 'react';
import { useWatch, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { FormField, Icon, type FormFieldProps } from '@/components/ui';
import { makeStyles, MIN_TOUCH, useColors } from '@/constants/theme';

import { PasswordRules } from './PasswordRules';

export interface PasswordFormFieldProps<T extends FieldValues> extends Omit<FormFieldProps<T>, 'secureTextEntry'> {
  /** Alanın altında canlı şifre kuralları (yeni şifre alanları). */
  rules?: 'compact' | 'list';
}

// Göz düğmesi alanın içinde, sağda: etiket satırı (18) + boşluk (6) + (52 − 44) / 2.
const EYE_TOP = 18 + 6 + 4;

/** Şifre alanı: göster/gizle düğmesi ve isteğe bağlı canlı kurallar. */
export function PasswordFormField<T extends FieldValues>({ rules, style, ...rest }: PasswordFormFieldProps<T>) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const [visible, setVisible] = useState(false);
  const value = useWatch({ control: rest.control, name: rest.name }) as string | undefined;

  return (
    <View>
      <View>
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
          secureTextEntry={!visible}
          style={[styles.input, style]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t('authScreens.password.hide') : t('authScreens.password.show')}
          onPress={() => setVisible((v) => !v)}
          hitSlop={4}
          style={({ pressed }) => [styles.eye, pressed && styles.pressed]}
        >
          <Icon name={visible ? 'visibility-off' : 'visibility'} size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      {rules ? <PasswordRules password={value ?? ''} layout={rules} /> : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  input: { paddingRight: MIN_TOUCH + 4 },
  eye: {
    position: 'absolute',
    top: EYE_TOP,
    right: 4,
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
}));
