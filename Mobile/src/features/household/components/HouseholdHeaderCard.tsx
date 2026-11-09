import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { plural } from '@/lib/i18n';

export interface HouseholdHeaderCardProps {
  name: string;
  memberCount: number;
  pendingInvitations: number;
  /** Yalnızca Household.Update izni varsa verilir (adı değiştir). */
  onRename?: () => void;
}

/** Hane kartı (Hane ve üyeler · üst): uygulama ikonu, hane adı, "4 üye · 1 bekleyen davet", düzenle. */
export function HouseholdHeaderCard({ name, memberCount, pendingInvitations, onRename }: HouseholdHeaderCardProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const meta = [
    plural('householdScreen.memberCount', memberCount),
    pendingInvitations > 0 ? plural('householdScreen.pendingCount', pendingInvitations) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <Image source={require('@/assets/images/icon.png')} style={styles.icon} accessible={false} />
      <View style={styles.texts}>
        <Text accessibilityRole="header" style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text variant="label" muted>
          {meta}
        </Text>
      </View>
      {onRename ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('householdScreen.rename.action')}
          onPress={onRename}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
        >
          <Icon name="edit" size={22} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
  },
  icon: { width: 48, height: 48, borderRadius: 14 },
  texts: { flex: 1, gap: 2 },
  name: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 22 },
  edit: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { backgroundColor: c.surface },
}));
