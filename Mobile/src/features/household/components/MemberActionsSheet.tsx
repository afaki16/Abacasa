import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { BottomSheet, Button, FormError, Icon, Text, type IconName } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { InitialsAvatar } from '@/features/account/components/SettingsKit';
import { usePersonOptions } from '@/features/people/hooks';
import { initials } from '@/features/people/relations';
import { enumLabel } from '@/lib/domain/enums';
import { toast } from '@/stores/toastStore';

import { useLeaveHousehold, useRemoveHouseholdMember, useUpdateHouseholdMember } from '../hooks';
import { leaveBlockReason } from '../memberView';
import { isLastAdmin } from '../rules';
import type { HouseholdMember } from '../types';
import { memberDisplayName } from './MemberRow';

export interface MemberActionsSheetProps {
  visible: boolean;
  /** Seçili üye (kapanış animasyonu sürerken de dolu kalır). */
  member: HouseholdMember | null;
  members: HouseholdMember[];
  onClose: () => void;
  /** HouseholdMembers.Update: rol ve bağlı kişi. */
  canUpdate: boolean;
  /** HouseholdMembers.Delete: başka üyeyi çıkarma. */
  canDelete: boolean;
}

type Mode = 'actions' | 'person' | 'remove' | 'leave';

/**
 * Üye işlemleri (alttan sayfa): bağlı kişiyi değiştir, rol değiştir, haneden çıkar; kendi satırında haneden ayrıl.
 * "Hanede her zaman en az bir yönetici kalır": tek yönetici rolünü düşüremez ve ayrılamaz — eylem pasif, nedeni altında.
 * Onaylar iç içe modal açmamak için aynı sayfada adım olarak gösterilir.
 */
export function MemberActionsSheet({ visible, member, members, onClose, canUpdate, canDelete }: MemberActionsSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const [mode, setMode] = useState<Mode>('actions');
  const update = useUpdateHouseholdMember();
  const remove = useRemoveHouseholdMember();
  const leave = useLeaveHousehold();
  const people = usePersonOptions();

  const close = () => {
    onClose();
    setMode('actions');
    update.reset();
    remove.reset();
    leave.reset();
  };

  if (!member) return null;

  const self = member.isCurrentUser;
  const name = memberDisplayName(member, t('members.you'));
  const role = enumLabel('householdRole', member.role);
  const lastAdmin = isLastAdmin(members, member.membershipId);
  const leaveBlock = self ? leaveBlockReason(members) : null;
  const error = (update.error ?? remove.error ?? leave.error)?.messages;

  const changeRole = () => {
    const next = member.role === 'Admin' ? 'Member' : 'Admin';
    update.mutate(
      { membershipId: member.membershipId, role: next, personId: member.personId },
      {
        onSuccess: (m) => {
          toast.success(t('members.roleChanged', { name: m.fullName, role: enumLabel('householdRole', m.role) }));
          close();
        },
      },
    );
  };

  const linkPerson = (personId: number | null) => {
    if (personId === member.personId) return close();
    update.mutate(
      { membershipId: member.membershipId, role: member.role, personId },
      {
        onSuccess: (m) => {
          toast.success(
            m.personName
              ? t('members.personLinked', { name: m.fullName, person: m.personName })
              : t('members.personUnlinked', { name: m.fullName }),
          );
          close();
        },
      },
    );
  };

  const confirmRemove = () =>
    remove.mutate(member.membershipId, {
      onSuccess: () => {
        toast.success(t('members.removed', { name: member.fullName }));
        close();
      },
    });

  const confirmLeave = () =>
    leave.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('householdScreen.leave.done'));
        close();
        router.dismissAll();
      },
    });

  if (mode === 'person') {
    const options: { id: number | null; label: string }[] = [
      { id: null, label: t('members.noPerson') },
      ...(people.data ?? []).map((p) => ({ id: p.id, label: p.name })),
    ];
    return (
      <BottomSheet visible={visible} onClose={close} title={t('members.personTitle')} contentPadding={Spacing.lg}>
        <Text variant="label" muted style={styles.hint}>
          {t('members.personHint')}
        </Text>
        <FormError messages={update.error?.messages ?? people.error?.messages} />
        {people.isPending ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel={t('common.loading')} />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
            {options.map((o) => {
              const selected = o.id === member.personId;
              return (
                <Pressable
                  key={o.id ?? 'none'}
                  accessibilityRole="radio"
                  accessibilityLabel={o.label}
                  accessibilityState={{ checked: selected, disabled: update.isPending }}
                  disabled={update.isPending}
                  onPress={() => linkPerson(o.id)}
                  style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                >
                  <Text style={styles.optionText} color={o.id === null ? colors.textMuted : colors.text}>
                    {o.label}
                  </Text>
                  {selected ? <Icon name="check" size={22} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </BottomSheet>
    );
  }

  if (mode === 'remove' || mode === 'leave') {
    const removing = mode === 'remove';
    return (
      <BottomSheet
        visible={visible}
        onClose={close}
        title={removing ? t('members.removeTitle', { name: member.fullName }) : t('householdScreen.leave.title')}
      >
        <Text muted>{removing ? t('members.removeMessage') : t('householdScreen.leave.message')}</Text>
        <FormError messages={error} />
        <View style={styles.confirmActions}>
          <Button
            title={t('common.dismiss')}
            variant="secondary"
            size="sm"
            disabled={remove.isPending || leave.isPending}
            onPress={() => setMode('actions')}
            style={styles.confirmButton}
          />
          <Button
            title={removing ? t('members.remove') : t('householdScreen.leave.confirm')}
            variant="destructive"
            size="sm"
            loading={remove.isPending || leave.isPending}
            onPress={removing ? confirmRemove : confirmLeave}
            style={styles.confirmButton}
          />
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={close} contentPadding={Spacing.lg}>
      <View style={styles.header}>
        <InitialsAvatar initials={initials(member.fullName)} size={44} />
        <View style={styles.headerTexts}>
          <Text accessibilityRole="header" style={styles.headerName} numberOfLines={2}>
            {name}
          </Text>
          <Text variant="label" muted>
            {[role, member.personName ? t('members.linkedPerson', { name: member.personName }) : t('members.noPerson')].join(
              ' · ',
            )}
          </Text>
        </View>
      </View>
      <FormError messages={error} />
      <View style={styles.actions}>
        {canUpdate ? (
          <ActionRow icon="link" title={t('members.changePerson')} onPress={() => setMode('person')} />
        ) : null}
        {canUpdate ? (
          member.role === 'Admin' && lastAdmin ? (
            <BlockedRow
              icon="swap-horiz"
              title={t('members.makeMember')}
              note={self ? t('members.lastAdminSelf') : t('members.lastAdmin')}
            />
          ) : (
            <ActionRow
              icon="swap-horiz"
              title={member.role === 'Admin' ? t('members.makeMember') : t('members.makeAdmin')}
              busy={update.isPending}
              onPress={changeRole}
            />
          )
        ) : null}
        {!self && canDelete ? (
          <ActionRow icon="person-remove" title={t('members.remove')} destructive onPress={() => setMode('remove')} />
        ) : null}
        {self ? (
          leaveBlock ? (
            <BlockedRow
              icon="logout"
              title={t('householdScreen.leave.action')}
              note={leaveBlock === 'lastAdmin' ? t('householdScreen.leave.lastAdmin') : t('householdScreen.leave.soleMember')}
            />
          ) : (
            <ActionRow
              icon="logout"
              title={t('householdScreen.leave.action')}
              destructive
              onPress={() => setMode('leave')}
            />
          )
        ) : null}
      </View>
    </BottomSheet>
  );
}

function ActionRow({
  icon,
  title,
  destructive,
  busy,
  onPress,
}: {
  icon: IconName;
  title: string;
  destructive?: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const color = destructive ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ busy: !!busy, disabled: !!busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={color} />
      <Text color={color} style={styles.actionText}>
        {title}
      </Text>
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : null}
    </Pressable>
  );
}

/** Yapılamayan eylem: gri zemin, pasif başlık ve nedeni (ör. son yönetici kuralı). */
function BlockedRow({ icon, title, note }: { icon: IconName; title: string; note: string }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${note}`}
      accessibilityState={{ disabled: true }}
      style={styles.blocked}
    >
      <Icon name={icon} size={22} color={colors.placeholder} />
      <View style={styles.blockedTexts}>
        <Text color={colors.placeholder} style={styles.actionText}>
          {title}
        </Text>
        <Text variant="label" muted>
          {note}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xs, paddingBottom: Spacing.sm },
  headerTexts: { flex: 1, gap: 2 },
  headerName: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 22 },
  actions: { gap: 6 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  actionText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 22 },
  blocked: {
    flexDirection: 'row',
    gap: 14,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: c.surface,
  },
  blockedTexts: { flex: 1, gap: 3 },
  pressed: { backgroundColor: c.surface },
  hint: { paddingHorizontal: Spacing.xs },
  scroll: { flexGrow: 0 },
  list: { gap: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  optionSelected: { backgroundColor: c.iconTile },
  optionText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmButton: { flex: 1, paddingHorizontal: Spacing.sm },
}));
