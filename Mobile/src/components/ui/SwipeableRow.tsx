import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type AccessibilityActionEvent } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { FontFamily, makeStyles, useColors } from '@/constants/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const ACTION_WIDTH = 76;

export interface SwipeableRowProps {
  children: ReactNode;
  /**
   * Eylemler yalnızca izin varsa verilir (ör. canEdit ? onEdit : undefined). İkisi de yoksa satır
   * kaymaz ve düz satır olarak çizilir (Bilesenler · 5: izni olmayanda Düzenle/Sil hiç görünmez).
   */
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Sola kaydırınca Düzenle / Sil gösteren liste satırı. Ekran okuyucuda aynı eylemler
 * "eylemler" menüsünden (accessibilityActions) seçilir; kaydırma gerekmez.
 */
export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();

  if (!onEdit && !onDelete) return <>{children}</>;

  const a11yActions = [
    ...(onEdit ? [{ name: 'edit', label: t('common.edit') }] : []),
    ...(onDelete ? [{ name: 'delete', label: t('common.delete') }] : []),
  ];
  const onA11yAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'edit') onEdit?.();
    if (e.nativeEvent.actionName === 'delete') onDelete?.();
  };

  const action = (methods: SwipeableMethods, icon: IconName, label: string, bg: string, fg: string, run: () => void) => (
    <Pressable
      key={icon}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        methods.close();
        run();
      }}
      style={({ pressed }) => [styles.action, { backgroundColor: bg }, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={fg} />
      <Text color={fg} style={styles.actionText}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View accessibilityActions={a11yActions} onAccessibilityAction={onA11yAction}>
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={ACTION_WIDTH / 2}
        overshootRight={false}
        // Satır zemini dolu olsun ki eylemler kaydırmadan önce görünmesin.
        childrenContainerStyle={{ backgroundColor: colors.card }}
        renderRightActions={(_progress, _translation, methods) => (
          <View style={styles.actions}>
            {onEdit
              ? action(methods, 'edit', t('common.edit'), colors.primarySoft, colors.primarySoftText, onEdit)
              : null}
            {onDelete
              ? action(methods, 'delete', t('common.delete'), colors.dangerSolid, colors.onDanger, onDelete)
              : null}
          </View>
        )}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  actions: { flexDirection: 'row' },
  action: { width: ACTION_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 2 },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.8 },
}));
