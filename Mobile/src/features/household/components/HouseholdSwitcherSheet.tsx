import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet, FormError, Icon, Text, TextField } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { useSwitchHousehold } from '@/features/auth/hooks';
import type { HouseholdMembership } from '@/features/auth/types';
import { enumLabel } from '@/lib/domain/enums';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

import { useCreateHousehold } from '../hooks';

// Seçici her çağrıda yeni [] döndürmesin (zustand sonsuz render döngüsü); saklı oturumda üyelikler /me ile gelir.
const NO_MEMBERSHIPS: HouseholdMembership[] = [];
const NAME_MAX = 100;

export interface HouseholdSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Hane seçici (Özet ve Harcamalar · "Hane seçici" alttan sayfası): üyelikler, rol, aktif hanede onay işareti
 * ve "Yeni hane oluştur". Oluşturma aynı sayfada ad sorar (hane oluşturma yetki istemez); oluşturulan haneye geçilir.
 */
export function HouseholdSwitcherSheet({ visible, onClose }: HouseholdSwitcherSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const activeTenantId = useAuthStore((s) => s.user?.activeTenant?.id ?? null);
  const memberships = useAuthStore((s) => s.user?.memberships ?? NO_MEMBERSHIPS);
  const switchHousehold = useSwitchHousehold();
  const createHousehold = useCreateHousehold();
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();

  const close = () => {
    onClose();
    setMode('list');
    setName('');
    setNameError(undefined);
    switchHousehold.reset();
    createHousehold.reset();
  };

  const select = (m: HouseholdMembership) => {
    if (m.tenantId === activeTenantId) return close();
    switchHousehold.mutate(m.tenantId, {
      onSuccess: () => {
        close();
        toast.success(t('household.switcher.switched', { name: m.name }));
      },
    });
  };

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return setNameError('validation.householdName.required');
    if (trimmed.length > NAME_MAX) return setNameError('validation.householdName.max');
    setNameError(undefined);
    createHousehold.mutate(trimmed, {
      onSuccess: (household) => {
        close();
        toast.success(t('household.create.created', { name: household.name }));
      },
    });
  };

  if (mode === 'create') {
    return (
      <BottomSheet
        visible={visible}
        onClose={close}
        title={t('household.create.title')}
        actionLabel={t('household.create.submit')}
        onAction={create}
        actionLoading={createHousehold.isPending}
      >
        <FormError messages={createHousehold.error?.messages} />
        <TextField
          label={t('household.create.name')}
          placeholder={t('household.create.placeholder')}
          value={name}
          onChangeText={setName}
          error={nameError}
          maxLength={NAME_MAX}
          autoFocus
          returnKeyType="go"
          onSubmitEditing={create}
        />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={close} title={t('household.switcher.title')} contentPadding={Spacing.lg}>
      <FormError messages={switchHousehold.error?.messages} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {memberships.map((m) => {
          const active = m.tenantId === activeTenantId;
          const pending = switchHousehold.isPending && switchHousehold.variables === m.tenantId;
          return (
            <Pressable
              key={m.tenantId}
              accessibilityRole="radio"
              accessibilityLabel={`${m.name}, ${enumLabel('householdRole', m.role)}`}
              accessibilityState={{ checked: active, busy: pending, disabled: switchHousehold.isPending }}
              disabled={switchHousehold.isPending}
              onPress={() => select(m)}
              style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
            >
              <View style={styles.initial}>
                <Text color={colors.iconTileText} style={styles.initialText}>
                  {m.name.trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
                </Text>
              </View>
              <View style={styles.texts}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {m.name}
                </Text>
                <Text variant="caption" muted>
                  {pending ? t('common.loading') : enumLabel('householdRole', m.role)}
                </Text>
              </View>
              {active ? <Icon name="check-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('household.switcher.create')}
        onPress={() => setMode('create')}
        style={({ pressed }) => [styles.createRow, pressed && styles.pressed]}
      >
        <Icon name="add-home" size={24} color={colors.primary} />
        <Text variant="bodyStrong" color={colors.primary}>
          {t('household.switcher.create')}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

const useStyles = makeStyles((c) => ({
  scroll: { flexGrow: 0 },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.button,
  },
  rowActive: { backgroundColor: c.iconTile },
  pressed: { backgroundColor: c.surface },
  initial: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: { fontFamily: FontFamily.bold, fontSize: 15 },
  texts: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: 6 },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.button,
  },
}));
