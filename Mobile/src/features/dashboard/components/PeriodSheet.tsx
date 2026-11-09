import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet, Icon, Text, type IconName } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { useHasPermission } from '@/features/auth/permissions';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import { formatDisplayDate } from '@/lib/format/period';

import { periodLabel, type StatementCard } from '../periodSelection';
import { useSelectedPeriod } from '../periodStore';

export interface PeriodSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Dönem seçimi alttan sayfası: önceki/sonraki dönem ve dönem türü (takvim ayı ya da kredi kartının
 * hesap kesim dönemi). Kartlar yalnızca ödeme araçlarını görme izni varsa listelenir.
 */
export function PeriodSheet({ visible, onClose }: PeriodSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { selection, period, shift, setCard } = useSelectedPeriod();
  const canReadCards = useHasPermission(PAYMENT_METHOD_PERMISSIONS.READ);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('summary.period.title')} actionLabel={t('common.ok')} onAction={onClose}>
      <View style={styles.nav}>
        <NavButton icon="chevron-left" label={t('summary.period.previous')} onPress={() => shift(-1)} />
        <View style={styles.navCenter} accessibilityLiveRegion="polite">
          <Text variant="bodyStrong">{periodLabel(selection)}</Text>
          <Text variant="caption" muted tabular>
            {formatDisplayDate(period.start)} – {formatDisplayDate(period.end)}
          </Text>
        </View>
        <NavButton icon="chevron-right" label={t('summary.period.next')} onPress={() => shift(1)} />
      </View>

      <View style={styles.options} accessibilityRole="radiogroup">
        <OptionRow
          icon="calendar-month"
          label={t('summary.period.calendarMonth')}
          selected={!selection.card}
          onPress={() => setCard(null)}
        />
        {canReadCards ? <CardOptions selectedId={selection.card?.id ?? null} onSelect={setCard} /> : null}
      </View>
    </BottomSheet>
  );
}

/** Kesim günü tanımlı aktif kredi kartları. */
function CardOptions({ selectedId, onSelect }: { selectedId: number | null; onSelect: (card: StatementCard) => void }) {
  const { t } = useTranslation();
  const options = usePaymentMethodOptions();
  const cards = (options.data ?? []).filter((m) => m.type === 'CreditCard' && m.isActive && m.statementDay);

  return cards.map((m) => (
    <OptionRow
      key={m.id}
      icon="credit-card"
      label={m.name}
      description={t('summary.period.statementDay', { day: m.statementDay })}
      selected={selectedId === m.id}
      onPress={() => onSelect({ id: m.id, name: m.name, statementDay: m.statementDay! })}
    />
  ));
}

function NavButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
    >
      <Icon name={icon} size={24} />
    </Pressable>
  );
}

function OptionRow({
  icon,
  label,
  description,
  selected,
  onPress,
}: {
  icon: IconName;
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={[label, description].filter(Boolean).join(', ')}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}
    >
      <Icon name={icon} size={20} color={colors.primary} />
      <View style={styles.optionTexts}>
        <Text variant={selected ? 'bodyStrong' : 'body'} style={!selected && styles.medium}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" muted>
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="check" size={22} color={colors.primary} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    padding: 6,
  },
  navCenter: { alignItems: 'center', gap: 2 },
  navButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  options: {
    marginTop: Spacing.md,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  optionTexts: { flex: 1, paddingVertical: Spacing.sm },
  medium: { fontFamily: FontFamily.medium },
  selected: { backgroundColor: c.iconTile },
  pressed: { backgroundColor: c.surface },
}));
