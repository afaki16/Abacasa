import { View, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamily, makeStyles, Radius, useColors, type BadgeVariant } from '@/constants/theme';

import { Text } from './Text';

export interface BadgeProps {
  /** Durum metni her zaman gösterilir; renk tek başına anlam taşımaz. */
  label: string;
  /**
   * paid: Ödendi · pending: Bekliyor / X gün kaldı · overdue: Gecikti · admin: Yönetici
   * member: Üye · info: Yemek kartı gibi bilgi etiketi · neutral: uzak tarih, pasif.
   */
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

/** Rozet (Bilesenler · 5). Renkler açık/koyu temaya göre theme.badges'ten. */
export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const styles = useStyles();
  const pair = useColors().badges[variant];
  return (
    <View accessible accessibilityLabel={label} style={[styles.badge, { backgroundColor: pair.bg }, style]}>
      <Text color={pair.fg} style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  label: { fontFamily: FontFamily.semibold, fontSize: 12, lineHeight: 16 },
}));
