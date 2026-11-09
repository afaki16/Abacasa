import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { IconTile } from '@/features/categories/components/DefinitionKit';
import { enumLabel } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { formatDisplayDate } from '@/lib/format/period';

import { OBLIGATION_ICONS, type DueTone } from '../reminders';
import type { VehicleObligation } from '../types';

import { dueText, toneVariant } from './VehicleCard';

/** Araç detayındaki işlem satırı: tür, tutar, tarih · geçerlilik sonu, not, güncel kaydın hatırlatması. */
export function ObligationRow({
  obligation,
  due,
  first,
  onPress,
}: {
  obligation: VehicleObligation;
  due: { daysLeft: number; tone: DueTone } | null;
  first: boolean;
  /** Vehicles.Update yoksa verilmez (satır salt okunur). */
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const type = enumLabel('vehicleObligationType', obligation.type);
  const amount = obligation.amount === null ? '—' : formatMoney(obligation.amount);
  const dates = t('vehicles.obligationDates', {
    date: formatDisplayDate(obligation.date),
    validUntil: formatDisplayDate(obligation.validUntil),
  });

  const content = (
    <View style={[styles.row, !first && styles.divider]}>
      <IconTile icon={OBLIGATION_ICONS[obligation.type]} size={40} />
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" style={styles.flex} numberOfLines={1}>
            {type}
          </Text>
          <Text variant="bodyStrong" tabular>
            {amount}
          </Text>
        </View>
        <Text variant="caption" muted>
          {dates}
        </Text>
        {obligation.note ? (
          <Text variant="caption" muted>
            {obligation.note}
          </Text>
        ) : null}
        <View style={styles.badges}>
          {due ? <Badge label={dueText(due.daysLeft)} variant={toneVariant(due.tone)} /> : null}
          {obligation.hasExpense ? <Badge label={t('vehicles.hasExpense')} variant="info" /> : null}
        </View>
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[type, amount, dates, obligation.note].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  texts: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 2 },
  pressed: { backgroundColor: c.surface },
}));
