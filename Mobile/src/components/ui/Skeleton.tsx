import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  /** Daha açık ton (ikincil satır). */
  soft?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Yükleniyor iskeleti: yavaşça nabız atan blok. "Hareketi azalt" açıksa sabit durur. */
export function Skeleton({ width = '100%', height = 12, radius = 6, soft, style }: SkeletonProps) {
  const colors = useColors();
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: soft ? colors.skeletonSoft : colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

/** Liste satırı iskeleti: ikon kutusu, iki satır metin, sağda tutar. */
export function SkeletonListRow({ titleWidth = '62%' }: { titleWidth?: DimensionValue }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} radius={Radius.md} />
      <View style={styles.texts}>
        <Skeleton width={titleWidth} height={12} />
        <Skeleton width="40%" height={10} radius={5} soft />
      </View>
      <Skeleton width={72} height={12} />
    </View>
  );
}

const WIDTHS: DimensionValue[] = ['70%', '55%', '62%'];

/**
 * Liste ekranı iskeleti: isteğe bağlı özet kartı bloğu + satırlar.
 * Ekran okuyucuya tek "Yükleniyor" olarak duyurulur.
 */
export function SkeletonList({ rows = 3, card }: { rows?: number; card?: boolean }) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={t('common.loading')} style={styles.list}>
      {card ? <Skeleton height={120} radius={Radius.xl} /> : null}
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonListRow key={i} titleWidth={WIDTHS[i % WIDTHS.length]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  list: { gap: Spacing.md, padding: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  texts: { flex: 1, gap: 6 },
}));
