import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { enumLabel } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';

import { donationMeta } from '../summary';
import type { DonationListItem } from '../types';

/** Bağış satırı (turkuaz ikon kutusu): tür, "tarih · veren → alıcı", tutar. */
export function DonationRow({
  donation,
  last,
  onPress,
}: {
  donation: DonationListItem;
  last?: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const meta = donationMeta(donation, t('donations.household'));
  const title = enumLabel('donationKind', donation.kind);
  const amount = formatMoney(donation.amount);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, ${meta}, ${amount}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.tile}>
        <Icon name="volunteer-activism" size={22} color={colors.badges.info.fg} />
      </View>
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" muted numberOfLines={2}>
          {meta}
        </Text>
      </View>
      <Text variant="bodyStrong" tabular style={styles.amount}>
        {amount}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: c.border },
  pressed: { backgroundColor: c.surface },
  tile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: c.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 3 },
  amount: { textAlign: 'right' },
}));
