import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';

import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { SearchBar } from './SearchBar';
import { Text } from './Text';

export interface SelectOption<V extends string | number> {
  value: V;
  label: string;
  /** Satırın altında küçük açıklama (ör. "Ahmet · Kredi kartı"). */
  description?: string;
  icon?: IconName;
  /** Sol tarafta ikon yerine kısa metin (para birimi sembolü, baş harf). */
  leading?: string;
}

export interface SelectSheetProps<V extends string | number> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectOption<V>[];
  value: V | null | undefined;
  /** Seçince sayfa kapanır (onClose da çağrılır). */
  onSelect: (value: V) => void;
  /** Arama kutusu; verilmezse 8'den fazla seçenekte otomatik açılır. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Listenin altında "Yeni … ekle" satırı (izin yoksa verme). */
  addLabel?: string;
  onAdd?: () => void;
  emptyText?: string;
}

/** Arama için Türkçe küçük harf (İ/I sorunu olmasın). */
const normalize = (s: string) => s.toLocaleLowerCase('tr-TR');

/**
 * Seçim listesi (Bilesenler · 4): alttan sayfada aranabilir liste, seçilide ana renkli onay işareti,
 * isteğe bağlı "yeni ekle" satırı. Kategori, kişi, ödeme aracı, para birimi seçimi için.
 */
export function SelectSheet<V extends string | number>({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect,
  searchable,
  searchPlaceholder,
  addLabel,
  onAdd,
  emptyText,
}: SelectSheetProps<V>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const showSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(o.label).includes(q) || (o.description && normalize(o.description).includes(q)));
  }, [options, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={title}>
      {showSearch ? <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} /> : null}
      <View style={styles.list}>
        <FlatList
          data={filtered}
          keyExtractor={(o) => String(o.value)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text muted style={styles.empty}>
              {emptyText ?? t('ui.select.noResults')}
            </Text>
          }
          renderItem={({ item, index }) => {
            const selected = item.value === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={[item.label, item.description].filter(Boolean).join(', ')}
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  onSelect(item.value);
                  close();
                }}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.divider,
                  selected && styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                {item.icon ? (
                  <Icon name={item.icon} size={20} color={colors.primary} />
                ) : item.leading ? (
                  <Text color={colors.primary} style={styles.leading}>
                    {item.leading}
                  </Text>
                ) : null}
                <View style={styles.texts}>
                  <Text variant={selected ? 'bodyStrong' : 'body'} style={!selected && styles.medium}>
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text variant="caption" muted>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                {selected ? <Icon name="check" size={22} color={colors.primary} /> : null}
              </Pressable>
            );
          }}
        />
      </View>
      {addLabel && onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          onPress={() => {
            close();
            onAdd();
          }}
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
        >
          <Icon name="add" size={22} color={colors.primary} />
          <Text variant="bodyStrong" color={colors.primary}>
            {addLabel}
          </Text>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

const useStyles = makeStyles((c) => ({
  list: {
    flexShrink: 1,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingHorizontal: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  selected: { backgroundColor: c.iconTile },
  pressed: { backgroundColor: c.surface },
  texts: { flex: 1, paddingVertical: Spacing.sm },
  medium: { fontFamily: FontFamily.medium },
  leading: { width: 32, textAlign: 'center', fontFamily: FontFamily.bold, fontSize: 16 },
  empty: { padding: Spacing.lg, textAlign: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingHorizontal: 14 },
}));
