import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, makeStyles, Radius, Spacing } from '@/constants/theme';

import { Button } from './Button';
import { Text } from './Text';

export interface BottomSheetProps {
  visible: boolean;
  /** Karartmaya dokunma, aşağı çekme, Android geri tuşu. Çağıran visible'ı false yapar. */
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  /** En altta tek birincil eylem (Onayla, Oluştur). */
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  /** İçerik yatay boşluğu (liste satırları kenara yakın dursun diye küçültülebilir). */
  contentPadding?: number;
}

const CLOSE_DISTANCE = 80;
const CLOSE_VELOCITY = 1;

/**
 * Alttan sayfa (Bilesenler · 7): tutamaç, başlık, içerik, en altta tek birincil eylem.
 * Arka plan karartılır; karartmaya dokununca ya da tutamaçtan aşağı çekince kapanır.
 * RN Modal + Animated + PanResponder (yeni native paket gerektirmez). Yükseklik ekranın %90'ıyla sınırlı;
 * uzun içerikte çağıran ScrollView / FlatList kullanır.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  actionLabel,
  onAction,
  actionLoading,
  actionDisabled,
  contentPadding = Spacing.lg,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Kapanırken animasyon bitene kadar Modal açık kalır: mounted, visible'dan bir adım geride iner.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const [translateY] = useState(() => new Animated.Value(windowHeight));
  const [scrim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      translateY.setValue(windowHeight);
      Animated.parallel([
        Animated.timing(scrim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 24, stiffness: 240, mass: 0.9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scrim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: windowHeight, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, windowHeight, translateY, scrim]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => translateY.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
            onClose();
          } else {
            Animated.spring(translateY, { toValue: 0, damping: 24, stiffness: 240, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () =>
          Animated.spring(translateY, { toValue: 0, damping: 24, stiffness: 240, useNativeDriver: true }).start(),
      }),
    // Sürükleme sırasında üst bileşen yeniden çizilmez (translateY setValue render tetiklemez).
    [translateY, onClose],
  );

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.scrim, { opacity: scrim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
        />
      </Animated.View>
      <KeyboardAvoidingView behavior="padding" style={styles.avoider} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { maxHeight: windowHeight * 0.9, paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm },
            { transform: [{ translateY }] },
          ]}
        >
          <View {...pan.panHandlers} style={[styles.header, { paddingHorizontal: contentPadding }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 40, right: 40 }}
              style={styles.handleArea}
            >
              <View style={styles.handle} />
            </Pressable>
            {title ? (
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
            ) : null}
          </View>
          <View style={[styles.content, { paddingHorizontal: contentPadding }]}>{children}</View>
          {actionLabel && onAction ? (
            <View style={[styles.action, { paddingHorizontal: contentPadding }]}>
              <Button
                title={actionLabel}
                onPress={onAction}
                loading={actionLoading}
                disabled={actionDisabled}
              />
            </View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.scrim },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.card,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
  },
  header: { paddingTop: Spacing.sm, gap: Spacing.sm },
  handleArea: { alignSelf: 'center', paddingVertical: Spacing.xs, marginBottom: Spacing.xs },
  handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: c.handle },
  title: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, paddingHorizontal: Spacing.xs, paddingBottom: Spacing.sm },
  content: { flexShrink: 1, gap: Spacing.md },
  action: { paddingTop: Spacing.md },
}));
