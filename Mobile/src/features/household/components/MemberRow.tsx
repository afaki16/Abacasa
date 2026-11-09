import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { InitialsAvatar } from '@/features/account/components/SettingsKit';
import { initials } from '@/features/people/relations';
import { enumLabel } from '@/lib/domain/enums';

import type { HouseholdMember } from '../types';

/** "Ahmet Yılmaz (sen)" — kendi satırında. */
export function memberDisplayName(member: Pick<HouseholdMember, 'fullName' | 'isCurrentUser'>, youLabel: string): string {
  return member.isCurrentUser ? `${member.fullName} (${youLabel})` : member.fullName;
}

export interface MemberRowProps {
  member: HouseholdMember;
  first?: boolean;
  /** Üye işlemleri (yönetici) ya da kendi satırında "Haneden ayrıl". Yoksa satır basılamaz. */
  onPress?: () => void;
}

/** Üye satırı: baş harfler, ad, bağlı kişi, rol rozeti. */
export function MemberRow({ member, first, onPress }: MemberRowProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const name = memberDisplayName(member, t('members.you'));
  const meta = member.personName ? t('members.linkedPerson', { name: member.personName }) : t('members.noPerson');
  const role = enumLabel('householdRole', member.role);

  const content = (
    <View style={[styles.row, !first && styles.divider]}>
      <InitialsAvatar initials={initials(member.fullName)} />
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" muted numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Badge label={role} variant={member.role === 'Admin' ? 'admin' : 'member'} style={styles.badge} />
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${meta}, ${role}`}
      accessibilityHint={t('members.actionsHint')}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64, paddingHorizontal: 14, paddingVertical: Spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  badge: { alignSelf: 'center' },
  pressed: { backgroundColor: c.surface },
}));
