import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { addMonths, daysInMonth, monthName, todayIso } from '@/lib/format/period';

import { BottomSheet } from './BottomSheet';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { Text } from './Text';

/** Pazartesiden başlayan hafta (tr ve en için aynı; uygulama genelinde tek düzen). */
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const parse = (value: string) => value.slice(0, 10).split('-').map(Number) as [number, number, number];

/** Ayın takvim hücreleri: başta boşluklar (null), sonra 1..n. Pazartesi = ilk sütun. */
export function monthGrid(year: number, month: number): (number | null)[] {
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  return [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)];
}

export interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Seçili tarih 'YYYY-MM-DD'. */
  value: string | null | undefined;
  /** Seçince sayfa kapanır (onClose da çağrılır). */
  onSelect: (value: string) => void;
  title?: string;
  /** Seçilebilecek en geç tarih (ör. bugün). */
  maxDate?: string;
  minDate?: string;
}

/** Tarih seçici (Bilesenler · 4): ay ızgarası, önceki/sonraki ay, Bugün / Dün çipleri. */
export function DatePickerSheet({ visible, onClose, value, onSelect, title, maxDate, minDate }: DatePickerSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const today = todayIso();
  const initial = parse(value || today);
  const [view, setView] = useState({ year: initial[0], month: initial[1] });

  // Her açılışta seçili tarihin ayından başla (render sırasında türetilen durum; efekt gerekmez).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setView({ year: initial[0], month: initial[1] });
  }

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }, []);

  const outOfRange = (date: string) => (!!maxDate && date > maxDate) || (!!minDate && date < minDate);
  const pick = (date: string) => {
    onSelect(date);
    onClose();
  };
  const move = (n: number) => setView((v) => addMonths(v.year, v.month, n));
  const monthTitle = `${monthName(view.month)} ${view.year}`;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title ?? t('ui.datePicker.title')}>
      <View style={styles.calendar}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ui.datePicker.previousMonth')}
            onPress={() => move(-1)}
            style={styles.navButton}
          >
            <Icon name="chevron-left" />
          </Pressable>
          <Text variant="bodyStrong" accessibilityRole="header" accessibilityLiveRegion="polite">
            {monthTitle}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ui.datePicker.nextMonth')}
            onPress={() => move(1)}
            style={styles.navButton}
          >
            <Icon name="chevron-right" />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {WEEKDAY_KEYS.map((k) => (
            <View key={k} style={styles.cell}>
              <Text style={styles.weekday} muted>
                {t(`ui.datePicker.weekdays.${k}`)}
              </Text>
            </View>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={styles.cell} />;
            const date = iso(view.year, view.month, day);
            const selected = date === value;
            const isToday = date === today;
            const disabled = outOfRange(date);
            return (
              <View key={date} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${day} ${monthTitle}`}
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => pick(date)}
                  style={({ pressed }) => [
                    styles.day,
                    isToday && !selected && styles.today,
                    selected && styles.daySelected,
                    pressed && !selected && styles.dayPressed,
                  ]}
                >
                  <Text
                    color={selected ? colors.onPrimary : disabled ? colors.textDisabled : isToday ? colors.primary : colors.text}
                    style={selected || isToday ? styles.dayTextStrong : styles.dayText}
                  >
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={styles.quick}>
          <Chip label={t('common.today')} selected={value === today} onPress={() => pick(today)} disabled={outOfRange(today)} />
          <Chip
            label={t('ui.datePicker.yesterday')}
            selected={value === yesterday}
            onPress={() => pick(yesterday)}
            disabled={outOfRange(yesterday)}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const useStyles = makeStyles((c) => ({
  calendar: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 1 },
  weekday: { fontFamily: FontFamily.semibold, fontSize: 11, lineHeight: 14, paddingVertical: Spacing.xs },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: c.primary },
  daySelected: { backgroundColor: c.primary },
  dayPressed: { backgroundColor: c.iconTile },
  dayText: { fontFamily: FontFamily.medium, fontSize: 14 },
  dayTextStrong: { fontFamily: FontFamily.bold, fontSize: 14 },
  quick: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs },
}));
