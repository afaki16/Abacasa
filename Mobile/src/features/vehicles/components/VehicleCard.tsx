import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { IconTile } from '@/features/categories/components/DefinitionKit';
import { enumLabel } from '@/lib/domain/enums';
import { plural, t as translate } from '@/lib/i18n';
import { formatDisplayDate } from '@/lib/format/period';

import { vehicleBadge, type DueTone } from '../reminders';
import type { Vehicle } from '../types';

const TONE_VARIANT = { overdue: 'overdue', pending: 'pending', neutral: 'neutral' } as const;

/** "12 gün kaldı" · "Bugün" · "Gecikti · 3 gün". */
export function dueText(daysLeft: number): string {
  if (daysLeft < 0) return plural('vehicles.overdueDays', -daysLeft, { n: -daysLeft });
  if (daysLeft === 0) return translate('vehicles.dueToday');
  return plural('vehicles.daysLeft', daysLeft, { n: daysLeft });
}

export function toneVariant(tone: DueTone) {
  return TONE_VARIANT[tone];
}

/** Araç listesi kartı (tasarım: Araçlar · Liste): ad, plaka · sahip, en yakın hatırlatma rozeti. */
export function VehicleCard({
  vehicle,
  today,
  onPress,
}: {
  vehicle: Vehicle;
  today: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const badge = vehicleBadge(vehicle, today);
  const meta = [
    vehicle.plate,
    vehicle.isActive ? (vehicle.ownerName ?? t('vehicles.household')) : t('common.inactive'),
  ].join(' · ');

  let label: string;
  let variant: 'overdue' | 'pending' | 'neutral' = 'neutral';
  switch (badge.kind) {
    case 'inactive':
      label = t('vehicles.noReminder');
      break;
    case 'none':
      label = t('vehicles.noObligation');
      break;
    case 'due':
      label = `${enumLabel('vehicleObligationType', badge.type)} · ${dueText(badge.daysLeft)}`;
      variant = toneVariant(badge.tone);
      break;
    case 'next':
      label = t('vehicles.nextDue', {
        type: enumLabel('vehicleObligationType', badge.type),
        date: formatDisplayDate(badge.validUntil),
      });
      break;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[vehicle.name, meta, label].join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        !vehicle.isActive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      <IconTile icon="directions-car" size={44} />
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {vehicle.name}
        </Text>
        <Text variant="label" muted numberOfLines={1}>
          {meta}
        </Text>
        <Badge label={label} variant={variant} style={styles.badge} />
      </View>
      <Icon name="chevron-right" size={20} color={colors.textDisabled} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  inactive: { opacity: 0.7 },
  pressed: { backgroundColor: c.surface },
  texts: { flex: 1, minWidth: 0, gap: 3 },
  badge: { alignSelf: 'flex-start', marginTop: Spacing.xs },
}));
