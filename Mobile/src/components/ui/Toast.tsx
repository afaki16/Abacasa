import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { useToastStore, type Toast as ToastModel } from '@/stores/toastStore';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Sekme çubuğunun (≈84) üstünde dursun. */
const BOTTOM_OFFSET = 96;

const ICONS: Record<ToastModel['variant'], IconName> = { success: 'check-circle', error: 'error', info: 'info' };

/**
 * Global toast gösterimi. Kök layout'ta bir kez, navigator'dan SONRA render edilir (üstte kalsın).
 * Süre dolunca kendini kapatır; ekran okuyucuya duyurulur.
 */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!current) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    AccessibilityInfo.announceForAccessibility(
      current.action ? `${current.message}. ${current.action.label}` : current.message,
    );
    const timer = setTimeout(() => hide(current.id), current.duration);
    return () => clearTimeout(timer);
  }, [current, hide, opacity]);

  if (!current) return null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.host, { paddingBottom: insets.bottom + BOTTOM_OFFSET }]}>
      <Animated.View style={{ opacity }}>
        <ToastView toast={current} onDismiss={() => hide(current.id)} />
      </Animated.View>
    </View>
  );
}

/** Tek toast görünümü (ters renkli yüzey). Testte ve ToastHost'ta kullanılır. */
export function ToastView({ toast, onDismiss }: { toast: ToastModel; onDismiss: () => void }) {
  const s = useStyles();
  const colors = useColors();
  const iconColor =
    toast.variant === 'success' ? colors.inverseSuccess : toast.variant === 'error' ? colors.inverseError : colors.onInverse;

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.toast}>
      <Icon name={ICONS[toast.variant]} size={22} color={iconColor} />
      <Text color={colors.onInverse} style={s.message}>
        {toast.message}
      </Text>
      {toast.action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={toast.action.label}
          hitSlop={8}
          onPress={() => {
            toast.action?.onPress();
            onDismiss();
          }}
          style={s.action}
        >
          <Text color={colors.inverseAction} style={s.actionText}>
            {toast.action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { justifyContent: 'flex-end', paddingHorizontal: Spacing.lg },
});

const useStyles = makeStyles((c) => ({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 14,
    borderRadius: Radius.button,
    backgroundColor: c.inverseSurface,
    shadowColor: c.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  message: { flex: 1, fontFamily: FontFamily.medium, paddingVertical: Spacing.sm },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: Spacing.xs },
  actionText: { fontFamily: FontFamily.semibold },
}));
