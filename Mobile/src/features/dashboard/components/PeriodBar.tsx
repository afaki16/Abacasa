import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius } from '@/constants/theme';

import { periodLabel } from '../periodSelection';
import { useSelectedPeriod } from '../periodStore';
import { PeriodSheet } from './PeriodSheet';

export interface PeriodBarProps {
  /** Kart görünümü (Kategoriye göre): beyaz zemin, ortada dönem + toplam. */
  framed?: boolean;
  /** Dönem adının altında ek içerik (ör. dönem toplamı). */
  children?: ReactNode;
}

/**
 * Dönem çubuğu: ‹ Kasım 2026 ›. Ortaya dokununca dönem seçici (takvim ayı / kart dönemi) açılır.
 * Kart döneminde adın altında kart adı görünür.
 */
export function PeriodBar({ framed, children }: PeriodBarProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { selection, shift } = useSelectedPeriod();
  const [open, setOpen] = useState(false);
  const label = periodLabel(selection);

  return (
    <View style={[styles.bar, framed && styles.framed]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('summary.period.previous')}
        onPress={() => shift(-1)}
        style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
      >
        <Icon name="chevron-left" size={24} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[label, selection.card?.name].filter(Boolean).join(', ')}
        accessibilityHint={t('summary.period.changeHint')}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.center, pressed && styles.pressed]}
      >
        <Text style={framed ? styles.titleFramed : styles.title} accessibilityLiveRegion="polite">
          {label}
        </Text>
        {selection.card ? (
          <Text variant="caption" muted numberOfLines={1}>
            {selection.card.name}
          </Text>
        ) : null}
        {children}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('summary.period.next')}
        onPress={() => shift(1)}
        style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
      >
        <Icon name="chevron-right" size={24} />
      </Pressable>
      <PeriodSheet visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  framed: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 6,
  },
  navButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  center: { flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  title: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 22 },
  titleFramed: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  pressed: { backgroundColor: c.surface },
}));
