import type { NativeStackHeaderProps } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { FontFamily, makeStyles, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';

export interface StackHeaderProps {
  title: string;
  /** Geri / kapat düğmesi; verilmezse sol boş kalır. */
  onBack?: () => void;
  /** close: tam ekran form (Harcama ekle) · back: yığın ekranı. */
  backIcon?: 'back' | 'close';
  /** Sağda metin eylemi (Ekle, Kaydet). İzin yoksa verme. */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Metin eylemi yerine özel öğe (ör. ikon düğmesi). */
  right?: ReactNode;
  /** Üst safe area boşluğunu kendisi eklesin (navigator başlığı olarak kullanılınca). */
  withInset?: boolean;
}

/** Yığın üst barı (StackBar): sol geri/kapat, ortada başlık, sağda isteğe bağlı metin eylemi. */
export function StackHeader({
  title,
  onBack,
  backIcon = 'back',
  actionLabel,
  onAction,
  actionDisabled,
  right,
  withInset,
}: StackHeaderProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, withInset && { paddingTop: insets.top }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backIcon === 'close' ? t('common.close') : t('ui.header.back')}
            onPress={onBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Icon name={backIcon === 'close' ? 'close' : 'arrow-back'} size={26} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {right ??
          (actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              accessibilityState={{ disabled: !!actionDisabled }}
              disabled={actionDisabled}
              onPress={onAction}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Text color={actionDisabled ? colors.textDisabled : colors.primary} style={styles.actionText}>
                {actionLabel}
              </Text>
            </Pressable>
          ) : null)}
      </View>
    </View>
  );
}

/**
 * Native stack'in `header` seçeneği için: başlık, geri düğmesi ve headerRight seçeneklerden gelir.
 *   <Stack screenOptions={{ header: (props) => <NavigatorStackHeader {...props} /> }} />
 */
export function NavigatorStackHeader({ navigation, options, route, back }: NativeStackHeaderProps) {
  const colors = useColors();
  const title = typeof options.title === 'string' ? options.title : route.name;
  const right = options.headerRight?.({ tintColor: colors.primary, canGoBack: !!back });
  return (
    <StackHeader
      title={title}
      withInset
      onBack={back ? () => navigation.goBack() : undefined}
      backIcon={options.presentation === 'modal' || options.presentation === 'fullScreenModal' ? 'close' : 'back'}
      right={right ?? undefined}
    />
  );
}

const useStyles = makeStyles((c) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.sm,
    backgroundColor: c.background,
  },
  side: { minWidth: 64, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end' },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  title: { flex: 1, textAlign: 'center', fontFamily: FontFamily.semibold, fontSize: 17, lineHeight: 22 },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 10 },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 16, textAlign: 'right' },
  pressed: { opacity: 0.6 },
}));
