import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { formatMoney } from '@/lib/format/money';
import { monthName, monthShortName } from '@/lib/format/period';

import type { LedgerYear } from '../types';
import {
  buildMonthSections,
  compactNet,
  lineName,
  monthHasData,
  type MonthLine,
  type MonthSection,
} from '../yearView';

export interface LedgerYearViewProps {
  data: LedgerYear;
  /** 1–12 */
  month: number;
  onMonthChange: (month: number) => void;
  /** Elle kalem satırına dokunulunca (hücre düzenleme); izin yoksa verilmez. */
  onEditLine?: (line: MonthLine) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** İşaretli tutar: "+₺143.550,00" / "-₺2.400,00". */
const signedMoney = (value: number) => (value > 0 ? `+${formatMoney(value)}` : formatMoney(value));

/**
 * Yıllık tablo gövdesi (tasarım: Yıllık tablo · seçilen ayın dökümü): yıl toplamları, ay şeridi (her ayın
 * neti), seçilen ayın bölümleri ve ay neti.
 */
export function LedgerYearView({ data, month, onMonthChange, onEditLine }: LedgerYearViewProps) {
  // Ay şeridi seçili aya kayar (Kasım seçiliyken Ocak–Mayıs görünüp seçili ay ekran dışında kalmasın).
  const stripRef = useRef<ScrollViewInstance>(null);
  const chipX = useRef<Record<number, number>>({});
  const scrollToMonth = (m: number) => {
    const x = chipX.current[m];
    if (x !== undefined) stripRef.current?.scrollTo({ x: Math.max(0, x - Spacing.lg), animated: false });
  };
  useEffect(() => {
    scrollToMonth(month);
  }, [month]);
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const sections = buildMonthSections(data, month);
  const net = data.totals.netByMonth[month - 1] ?? 0;
  const netTone = net < 0 ? colors.badges.overdue : colors.badges.paid;
  const yearNetColor = data.totals.netTotal < 0 ? colors.danger : colors.badges.paid.fg;

  return (
    <View style={styles.container}>
      <View style={styles.totals} accessible accessibilityRole="summary">
        <TotalCell label={t('ledger.yearIncome')} value={formatMoney(data.totals.incomeTotal)} />
        <TotalCell label={t('ledger.yearExpense')} value={formatMoney(data.totals.expenseTotal)} />
        <TotalCell
          label={t('ledger.yearNet')}
          value={signedMoney(data.totals.netTotal)}
          color={yearNetColor}
          strong
        />
      </View>

      <ScrollView
        ref={stripRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        accessibilityRole="tablist"
      >
        {MONTHS.map((m) => {
          const selected = m === month;
          const compact = compactNet(data.totals.netByMonth[m - 1] ?? 0, monthHasData(data, m));
          const negative = (data.totals.netByMonth[m - 1] ?? 0) < 0;
          const netText = compact ? `${compact.text}${t(`ledger.unit.${compact.unit}`)}` : '—';
          return (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${monthName(m)}, ${t('ledger.net')} ${netText}`}
              onPress={() => onMonthChange(m)}
              onLayout={(e) => {
                chipX.current[m] = e.nativeEvent.layout.x;
                if (m === month) scrollToMonth(m);
              }}
              style={[styles.monthChip, selected && styles.monthChipSelected]}
            >
              <Text style={styles.monthName} color={selected ? colors.onPrimary : colors.text}>
                {monthShortName(m)}
              </Text>
              <Text
                tabular
                style={styles.monthNet}
                color={selected ? colors.onPrimary : negative ? colors.danger : colors.textMuted}
              >
                {netText}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.card}>
        {sections.map((section, i) => (
          <SectionBlock
            key={section.key}
            section={section}
            first={i === 0}
            onEditLine={onEditLine}
          />
        ))}
      </View>

      <View style={[styles.netBanner, { backgroundColor: netTone.bg }]} accessible>
        <Text style={styles.netLabel} color={netTone.fg}>
          {t('ledger.monthNet', { month: monthName(month) })}
        </Text>
        <Text tabular style={styles.netValue} color={netTone.fg}>
          {signedMoney(net)}
        </Text>
      </View>
    </View>
  );
}

function TotalCell({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={styles.totalCell}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text
        tabular
        style={strong ? styles.totalStrong : styles.totalValue}
        color={color}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function SectionBlock({
  section,
  first,
  onEditLine,
}: {
  section: MonthSection;
  first: boolean;
  onEditLine?: (line: MonthLine) => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const color =
    section.key === 'income'
      ? colors.badges.paid.fg
      : section.key === 'plan'
        ? colors.badges.info.fg
        : colors.text;
  const lines = expanded ? [...section.lines, ...section.rest] : section.lines;

  return (
    <View style={[styles.section, !first && styles.sectionDivider]}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle} color={color}>
          {t(`ledger.sections.${section.key}`)}
        </Text>
        <Text tabular style={styles.sectionTotal} color={color}>
          {formatMoney(section.total)}
        </Text>
      </View>
      {section.key === 'income' && section.lines.length === 0 ? (
        <Text variant="caption" muted style={styles.emptyLine}>
          {t('ledger.noIncome')}
        </Text>
      ) : null}
      {lines.map((line) => {
        const name = lineName(line.row);
        const amount = line.amount === null ? '—' : formatMoney(line.amount);
        const content = (
          <View style={styles.line}>
            <Text muted style={styles.lineName} numberOfLines={1}>
              {name}
            </Text>
            <Text tabular>{amount}</Text>
            {line.editable && onEditLine ? (
              <Icon name="edit" size={16} color={colors.textDisabled} />
            ) : null}
          </View>
        );
        if (!line.editable || !onEditLine) return <View key={line.key}>{content}</View>;
        return (
          <Pressable
            key={line.key}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${amount}`}
            accessibilityHint={t('ledger.editCellHint')}
            onPress={() => onEditLine(line)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            {content}
          </Pressable>
        );
      })}
      {section.rest.length > 0 && !expanded ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(
            `ledger.rest.${section.key === 'spending' ? 'categories' : 'items'}`,
            {
              count: section.rest.length,
            },
          )}
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [styles.line, pressed && styles.pressed]}
        >
          <Text muted style={styles.lineName}>
            {t(`ledger.rest.${section.key === 'spending' ? 'categories' : 'items'}`, {
              count: section.rest.length,
            })}
          </Text>
          <Text tabular>{formatMoney(section.restTotal)}</Text>
          <Icon name="expand-more" size={18} color={colors.textDisabled} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: Spacing.md },
  totals: {
    marginHorizontal: Spacing.lg,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  totalCell: { flex: 1, gap: 2 },
  totalValue: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  totalStrong: { fontFamily: FontFamily.bold, fontSize: 15, lineHeight: 20 },
  strip: { gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  monthChip: {
    width: 72,
    minHeight: 60,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  monthChipSelected: { backgroundColor: c.primary, borderColor: c.primary },
  monthName: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18 },
  monthNet: { fontFamily: FontFamily.semibold, fontSize: 11, lineHeight: 14 },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  section: { paddingTop: 10, paddingBottom: 6, paddingHorizontal: 14 },
  sectionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 4,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, flexShrink: 1 },
  sectionTotal: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 18 },
  line: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: Spacing.sm },
  lineName: { flex: 1, fontSize: 14 },
  emptyLine: { paddingBottom: Spacing.sm },
  pressed: { backgroundColor: c.surface },
  netBanner: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  netLabel: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  netValue: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26 },
}));
