// Diğer grubunun (Yıllık tablo, Araçlar, Tanımlar) ortak küçük parçaları. Kitte karşılığı olmayanlar
// burada durur: seçim alanı, başlık metin eylemi, "kullanımda" penceresi, kart içi bölüm satırı.
// Kit'e taşınabilir (bkz. rapor); şimdilik yalnızca bu grubun ekranları kullanır.

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button, Icon, Text, type IconName } from '@/components/ui';
import {
  FontFamily,
  FontSize,
  makeStyles,
  MIN_TOUCH,
  Radius,
  Spacing,
  useColors,
} from '@/constants/theme';
import { translateMessage } from '@/features/auth/validation';

/** Seçim alanı: etiket üstte, değer + açılır ok (dokununca SelectSheet / DatePickerSheet açılır). */
export function PickerField({
  label,
  value,
  placeholder,
  icon = 'expand-more',
  error,
  disabled,
  onPress,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  icon?: IconName;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  useTranslation();
  const styles = useKitStyles();
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text variant="label" color={error ? colors.danger : colors.textMuted}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder || ''}`}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityHint={error ? translateMessage(error) : undefined}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.box,
          !!error && styles.boxError,
          disabled && styles.boxDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={styles.value}
          color={value ? (disabled ? colors.textMuted : colors.text) : colors.placeholder}
          numberOfLines={1}
        >
          {value || placeholder || ''}
        </Text>
        <Icon name={icon} size={20} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="error" size={16} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.flex}>
            {translateMessage(error)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Yığın başlığının sağındaki metin eylemi (Ekle, Düzenle). headerRight içinde kullanılır. */
export function HeaderTextAction({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useKitStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressedOpacity]}
    >
      <Text color={colors.primary} style={styles.headerActionText}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Silinemeyen tanım penceresi (tasarım: Kişiler · silinemeyen tanım uyarısı). Backend'in yerelleştirilmiş
 * 409 mesajı gösterilir. İsteğe bağlı ikincil eylem (ör. ödeme aracını pasif yap).
 */
export function InUseDialog({
  visible,
  title,
  message,
  onClose,
  secondaryLabel,
  onSecondary,
  secondaryLoading,
}: {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryLoading?: boolean;
}) {
  const { t } = useTranslation();
  const styles = useKitStyles();
  const colors = useColors();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
        />
        <View accessibilityViewIsModal accessibilityRole="alert" style={styles.dialog}>
          <View style={[styles.dialogIcon, { backgroundColor: colors.badges.pending.bg }]}>
            <Icon name="link" size={24} color={colors.badges.pending.fg} />
          </View>
          <Text accessibilityRole="header" style={styles.dialogTitle}>
            {title}
          </Text>
          {message ? <Text muted>{message}</Text> : null}
          <Button title={t('common.ok')} onPress={onClose} style={styles.dialogButton} />
          {secondaryLabel && onSecondary ? (
            <Button
              title={secondaryLabel}
              variant="ghost"
              loading={secondaryLoading}
              onPress={onSecondary}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/** Büyük harfli bölüm başlığı (Diğer menüsü, Aktif / Pasif). */
export function SectionLabel({ children }: { children: string }) {
  const styles = useKitStyles();
  return (
    <Text accessibilityRole="header" muted style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

/**
 * Sanal listede (FlashList) tek kart görünümü: her satır kartın bir dilimidir; ilk satır üst köşeleri,
 * son satır alt köşeleri yuvarlar, aradakiler ayırıcıyla ayrılır.
 */
export function CardSegment({
  first,
  last,
  children,
  style,
}: {
  first: boolean;
  last: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useKitStyles();
  return (
    <View
      style={[
        styles.segment,
        first && styles.segmentFirst,
        last && styles.segmentLast,
        !first && styles.segmentDivider,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Kart içi satır: sol öğe (ikon kutusu / baş harf), başlık + alt satır, sağda ek öğe ve ok. */
export function DefinitionRow({
  leading,
  title,
  subtitle,
  trailing,
  muted,
  divider,
  onPress,
  accessibilityLabel,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string | null;
  trailing?: ReactNode;
  muted?: boolean;
  /** Kart içinde önceki satırla arasına çizgi. */
  divider?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const styles = useKitStyles();
  const colors = useColors();
  const content = (
    <View style={[styles.row, divider && styles.segmentDivider]}>
      {leading}
      <View style={styles.rowTexts}>
        <Text variant="bodyStrong" color={muted ? colors.textMuted : colors.text} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="caption"
            color={muted ? colors.placeholder : colors.textMuted}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevron-right" size={20} color={colors.textDisabled} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

/** Kare ikon kutusu (kategori, araç, araç işlemi). */
export function IconTile({ icon, size = 36 }: { icon: IconName; size?: number }) {
  const colors = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size >= 44 ? Radius.md : 10,
        backgroundColor: colors.iconTile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={size >= 44 ? 24 : size >= 40 ? 22 : 20} color={colors.iconTileText} />
    </View>
  );
}

const useKitStyles = makeStyles((c) => ({
  flex: { flex: 1 },
  field: { gap: 6 },
  box: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 14,
  },
  boxError: { borderWidth: 2, borderColor: c.danger, paddingHorizontal: 13 },
  boxDisabled: { backgroundColor: c.surface, borderColor: c.border },
  value: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.body + 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  pressed: { backgroundColor: c.surface },
  pressedOpacity: { opacity: 0.6 },
  headerAction: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 10 },
  headerActionText: { fontFamily: FontFamily.semibold, fontSize: 16, textAlign: 'right' },
  scrim: { flex: 1, backgroundColor: c.scrim, justifyContent: 'center', padding: Spacing.xl },
  dialog: {
    backgroundColor: c.card,
    borderRadius: Radius.xl,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  dialogIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  dialogButton: { marginTop: 6 },
  sectionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingTop: Spacing.sm - 2,
    paddingHorizontal: Spacing.xs,
  },
  segment: {
    backgroundColor: c.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  segmentFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  segmentLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  segmentDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
  },
  rowTexts: { flex: 1, gap: 2 },
}));
