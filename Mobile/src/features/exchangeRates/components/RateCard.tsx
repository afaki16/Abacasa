import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { enumLabel } from '@/lib/domain/enums';
import { formatDisplayDate } from '@/lib/format/period';

import { formatRate, type RateCardModel } from '../current';

/**
 * Birim kartı (tasarım: Döviz kurları): ad, birim, güncel kur, kaynak rozeti ve eylem.
 * Eylem: "Elle gir" (Create) ya da güncel kur elle girildiyse "Merkez bankasına dön" (Delete; elle kaydı siler).
 */
export function RateCard({
  model,
  onManualEntry,
  onRevert,
}: {
  model: RateCardModel;
  /** ExchangeRates.Create yoksa verilmez. */
  onManualEntry?: () => void;
  /** ExchangeRates.Delete yoksa ya da kur elle değilse verilmez. */
  onRevert?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const name = enumLabel('currency', model.currency);
  const unit = t(`exchangeRates.unit.${model.currency}`);

  let badge: { label: string; variant: 'info' | 'admin' | 'pending' };
  if (model.source === 'TCMB') badge = { label: t('exchangeRates.sourceTcmb'), variant: 'info' };
  else if (model.source === 'Elle')
    badge = { label: t('exchangeRates.sourceManual'), variant: 'admin' };
  else badge = { label: t('exchangeRates.noRate'), variant: 'pending' };

  const canRevert = model.source === 'Elle' && model.manualId !== null && !!onRevert;
  const action = canRevert
    ? { label: t('exchangeRates.revert'), onPress: onRevert }
    : onManualEntry
      ? { label: t('exchangeRates.manualEntry'), onPress: onManualEntry }
      : null;

  return (
    <View style={styles.card}>
      <View
        style={styles.top}
        accessible
        accessibilityLabel={`${name}, ${unit}, ${formatRate(model.rate, model.currency)}`}
      >
        <View style={styles.flex}>
          <Text variant="bodyStrong">{name}</Text>
          <Text variant="caption" muted>
            {model.date ? `${unit} · ${formatDisplayDate(model.date)}` : unit}
          </Text>
        </View>
        <Text tabular style={styles.rate}>
          {formatRate(model.rate, model.currency)}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Badge label={badge.label} variant={badge.variant} />
        <View style={styles.actions}>
          {canRevert && onManualEntry ? (
            <Pressable
              accessibilityRole="button"
              onPress={onManualEntry}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Text color={colors.primary} style={styles.actionText}>
                {t('exchangeRates.manualEntry')}
              </Text>
            </Pressable>
          ) : null}
          {action ? (
            <Pressable
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Text color={colors.primary} style={styles.actionText}>
                {action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: Spacing.xs,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flex: { flex: 1, gap: 2 },
  rate: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26 },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    minHeight: MIN_TOUCH + Spacing.sm,
  },
  actions: { flexDirection: 'row', gap: Spacing.md, flexShrink: 1, justifyContent: 'flex-end' },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 14, textAlign: 'right' },
  pressed: { opacity: 0.6 },
}));
