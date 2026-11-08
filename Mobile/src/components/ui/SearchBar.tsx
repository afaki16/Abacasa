import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { FontFamily, FontSize, makeStyles, Radius, Spacing, useColorSchemeName, useColors } from '@/constants/theme';

import { Icon } from './Icon';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  /** Verilmezse "Ara" (common.search). */
  placeholder?: string;
  autoFocus?: boolean;
}

/** Liste üstü arama kutusu. Debounce'u çağıran yapar (useDebouncedValue). */
export function SearchBar({ value, onChangeText, placeholder, autoFocus }: SearchBarProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const scheme = useColorSchemeName();
  const text = placeholder ?? t('common.search');

  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color={colors.placeholder} />
      <TextInput
        accessibilityLabel={text}
        value={value}
        onChangeText={onChangeText}
        placeholder={text}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        keyboardAppearance={scheme}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ui.searchBar.clear')}
          hitSlop={12}
          onPress={() => onChangeText('')}
        >
          <Icon name="cancel" size={18} color={colors.textDisabled} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: c.text,
    paddingVertical: Spacing.sm,
  },
}));
