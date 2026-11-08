import { Pressable, View } from 'react-native';

import { FontFamily, makeStyles, Radius, useColors } from '@/constants/theme';

import { Text } from './Text';

export interface Segment<V extends string | number> {
  value: V;
  label: string;
}

export interface SegmentedControlProps<V extends string | number> {
  segments: Segment<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Grubun ekran okuyucu adı (ör. "Tema"). */
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * Segment kontrolü (Bilesenler · 4): 2–4 kısa seçenek arasında tek seçim (Açık / Koyu / Sistem).
 * Etiketler iki satıra sarılabilir; uzun listeler için OptionCards ya da SelectSheet.
 */
export function SegmentedControl<V extends string | number>({
  segments,
  value,
  onChange,
  accessibilityLabel,
  disabled,
}: SegmentedControlProps<V>) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.track}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={String(segment.value)}
            accessibilityRole="radio"
            accessibilityLabel={segment.label}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            hitSlop={{ top: 3, bottom: 3 }}
            onPress={() => {
              if (!selected) onChange(segment.value);
            }}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text
              color={selected ? colors.text : colors.textMuted}
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={2}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  track: { flexDirection: 'row', backgroundColor: c.track, borderRadius: Radius.md, padding: 3 },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  selected: {
    backgroundColor: c.trackActive,
    shadowColor: c.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 17, textAlign: 'center' },
  labelSelected: { fontFamily: FontFamily.semibold },
}));
