import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { FontFamily, makeStyles, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';

export interface HouseholdBarProps {
  /** Aktif hane adı; hiç hane yoksa uygulama adı gösterilir. */
  name: string;
  /** Rol rozeti metni (Yönetici / Üye); boşsa rozet yok. */
  roleLabel?: string;
  roleVariant?: 'admin' | 'member';
  /** Hane seçiciyi açar. */
  onPress?: () => void;
}

/**
 * Sekme ekranlarının üst barı (HaneBar): uygulama ikonu, hane adı + açılır ok, rol rozeti.
 * Ada dokununca hane seçici alttan sayfası açılır. Safe area üst boşluğunu çağıran verir.
 */
export function HouseholdBar({ name, roleLabel, roleVariant = 'member', onPress }: HouseholdBarProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.bar}>
      <Image source={require('@/assets/images/icon.png')} style={styles.icon} accessible={false} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('household.bar.label', { name })}
        accessibilityHint={t('household.bar.hint')}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.name, pressed && styles.pressed]}
      >
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
        {onPress ? <Icon name="expand-more" size={22} color={colors.text} /> : null}
      </Pressable>
      {roleLabel ? <Badge label={roleLabel} variant={roleVariant} /> : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingLeft: 20,
    paddingRight: Spacing.lg,
    minHeight: 48,
  },
  icon: { width: 30, height: 30, borderRadius: 8 },
  name: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: MIN_TOUCH, flexShrink: 1 },
  nameText: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 22, flexShrink: 1 },
  pressed: { opacity: 0.6 },
}));
