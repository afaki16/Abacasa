// Planlama ekranlarında (sabit ödeme, bağış, emanet, borç) ortak küçük parçalar. Kitte karşılığı yok;
// tasarımdaki ince ölçüler (40px çerçeveli eylem, ilerleme çubuğu, uyarı bandı, bölüm başlığı).

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName, Text } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

/** Çerçeveli küçük eylem (40 yükseklik; dokunma alanı 44): "Ödendi olarak işaretle", "Ödemeler (3)". */
export function OutlineAction({
  label,
  icon,
  count,
  onPress,
  disabled,
  fullWidth,
  accessibilityLabel,
}: {
  label: string;
  icon?: IconName;
  count?: number;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}) {
  const styles = useBitStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (count !== undefined ? `${label} (${count})` : label)
      }
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={{ top: 2, bottom: 2 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        fullWidth && styles.actionFull,
        pressed && styles.actionPressed,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={colors.primarySoftText} /> : null}
      <Text
        color={disabled ? colors.textDisabled : colors.primarySoftText}
        style={styles.actionText}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <View style={styles.count}>
          <Text color={colors.primarySoftText} style={styles.countText} tabular>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** İnce ilerleme çubuğu (0–1). tone: teal (bağış/hedef), primary (borç), success (tamamlandı). */
export function ProgressBar({
  value,
  tone = 'teal',
}: {
  value: number;
  tone?: 'teal' | 'primary' | 'success';
}) {
  const styles = useBitStyles();
  const colors = useColors();
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const fill =
    tone === 'primary' ? colors.primary : tone === 'success' ? colors.success : colors.teal;
  const track =
    tone === 'primary'
      ? colors.primarySoft
      : tone === 'success'
        ? colors.successSurface
        : colors.tealSoft;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[styles.track, { backgroundColor: track }]}
    >
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
    </View>
  );
}

/** Sarı uyarı bandı (tutarı belli olmayan vade vb.). */
export function WarningNote({ children }: { children: string }) {
  const styles = useBitStyles();
  const colors = useColors();
  return (
    <View accessible accessibilityRole="alert" style={styles.warning}>
      <Icon name="warning" size={18} color={colors.badges.pending.fg} />
      <Text variant="label" color={colors.badges.pending.fg} style={styles.flex}>
        {children}
      </Text>
    </View>
  );
}

/** Liste üstü bölüm başlığı: solda metin, sağda isteğe bağlı ana renkli metin eylemi ("+ Plan ekle"). */
export function SectionHeader({
  title,
  actionLabel,
  actionIcon,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
}) {
  const styles = useBitStyles();
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" variant="bodyStrong" style={styles.flex}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          {actionIcon ? <Icon name={actionIcon} size={18} color={colors.primary} /> : null}
          <Text color={colors.primary} style={styles.linkText}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Etiket–değer satırı (özet kutularında: "Toplam / $1.200,00"). */
export function KeyValue({
  label,
  value,
  align = 'left',
}: {
  label: string;
  value: ReactNode;
  align?: 'left' | 'right';
}) {
  const styles = useBitStyles();
  return (
    <View style={[styles.kv, align === 'right' && styles.kvRight]}>
      <Text variant="caption" muted>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="bodyStrong" tabular numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

/** Kit dışı denetimler (segment, tutar, ay seçici) için üstte etiket, altta hata ya da ipucu. */
export function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  useTranslation(); // dil değişince hata metni yeniden çevrilsin
  const styles = useBitStyles();
  const colors = useColors();
  return (
    <View style={styles.labeled}>
      <Text variant="label" color={error ? colors.danger : colors.textMuted}>
        {label}
      </Text>
      {children}
      {error ? (
        <Text variant="label" color={colors.danger}>
          {translateMessage(error)}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Yığın üst barında sağdaki metin eylemi (StackBar "Ekle"); headerRight olarak verilir. */
export function HeaderTextAction({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useBitStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
    >
      <Text color={colors.primary} style={styles.headerActionText}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Sanal listede (FlashList) tek kart görünümü: satırlar ayrı öğe olsa da ilk satır üst, son satır alt
 * köşeleri yuvarlar; aradakiler kenarlıkla birleşir.
 */
export function CardRow({
  first,
  last,
  children,
}: {
  first: boolean;
  last: boolean;
  children: ReactNode;
}) {
  const styles = useBitStyles();
  return (
    <View style={[styles.cardRow, first && styles.cardRowFirst, last && styles.cardRowLast]}>
      {children}
    </View>
  );
}

const useBitStyles = makeStyles((c) => ({
  labeled: { gap: 6 },
  headerAction: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 10 },
  headerActionPressed: { opacity: 0.6 },
  headerActionText: { fontFamily: FontFamily.semibold, fontSize: 16, textAlign: 'right' },
  cardRow: {
    backgroundColor: c.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  cardRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  cardRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  action: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.primaryOutline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionFull: { alignSelf: 'stretch' },
  actionPressed: { backgroundColor: c.primarySoft, borderColor: c.primarySoftBorder },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 18 },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: FontFamily.semibold, fontSize: 12, lineHeight: 16 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' },
  warning: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: c.warningSurface,
  },
  flex: { flex: 1 },
  section: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH, gap: Spacing.sm },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
  },
  linkPressed: { backgroundColor: c.iconTile },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 18 },
  kv: { flex: 1, gap: 2 },
  kvRight: { alignItems: 'flex-end' },
}));
