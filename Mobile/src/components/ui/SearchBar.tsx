import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

/** Liste üstü arama kutusu. Debounce'u çağıran yapar (useDebouncedValue). */
export function SearchBar({ value, onChangeText, placeholder = 'Ara' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={Colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Aramayı temizle" hitSlop={8} onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={Colors.textDisabled} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: { flex: 1, fontSize: FontSize.body, color: Colors.text, paddingVertical: Spacing.sm },
});
