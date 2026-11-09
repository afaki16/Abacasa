import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';
import { currentLocale } from '@/lib/i18n';

// Hane · Profil · Ayarlar ekranlarının ortak parçaları (tasarım: büyük harfli bölüm etiketi, beyaz grup kartı,
// ikonlu satır, bilgi kutusu, üst bar metin eylemi). Kit'te karşılığı olmayan küçük düzenler.

/** Büyük harfli bölüm etiketi ("ÜYELER", "TEHLİKELİ BÖLGE"). */
export function SectionLabel({ label, first }: { label: string; first?: boolean }) {
  const styles = useStyles();
  return (
    <Text accessibilityRole="header" variant="caption" muted style={[styles.section, first && styles.sectionFirst]}>
      {label.toLocaleUpperCase(currentLocale() === 'tr' ? 'tr-TR' : 'en-US')}
    </Text>
  );
}

/** Satırları kenara dayalı beyaz kart. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.group}>{children}</View>;
}

export interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Satır ikonu ana renkte (ör. "Excel olarak indir"). */
  iconTone?: 'muted' | 'primary';
  destructive?: boolean;
  disabled?: boolean;
  /** Sağdaki öğe (rozet, anahtar, metin düğmesi); verilmez ve onPress varsa ok. */
  trailing?: ReactNode;
  /** Sağda dış bağlantı ikonu (open-in-new). */
  external?: boolean;
  /** İlk satır değilse üstte ayırıcı çizgi. */
  first?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}

/** Grup kartı satırı: ikon, başlık (+ açıklama), sağda ok / öğe. Yıkıcı satır kırmızı. */
export function SettingsRow({
  title,
  subtitle,
  icon,
  iconTone = 'muted',
  destructive,
  disabled,
  trailing,
  external,
  first,
  onPress,
  accessibilityHint,
}: SettingsRowProps) {
  const styles = useStyles();
  const colors = useColors();
  const textColor = disabled ? colors.textDisabled : destructive ? colors.danger : colors.text;
  const iconColor = disabled
    ? colors.textDisabled
    : destructive
      ? colors.danger
      : iconTone === 'primary'
        ? colors.primary
        : colors.textMuted;

  const content = (
    <View style={[styles.row, !first && styles.divider]}>
      {icon ? <Icon name={icon} size={22} color={iconColor} /> : null}
      <View style={styles.texts}>
        <Text color={textColor} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (external ? (
          <Icon name="open-in-new" size={20} color={colors.textDisabled} />
        ) : onPress && !disabled ? (
          <Icon name="chevron-right" size={20} color={colors.textDisabled} />
        ) : null)}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

/** Üst barda metin eylemi (Ayarlar, Kaydet). İzin yoksa hiç verilmez. */
export function HeaderTextAction({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerPressed]}
    >
      <Text color={disabled ? colors.textDisabled : colors.primary} style={styles.headerActionText}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Metin düğmesi (satır sonunda "İptal et", "Kapat"). En az 44 dokunma alanı. */
export function InlineTextButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger';
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const styles = useStyles();
  const colors = useColors();
  const color = disabled ? colors.textDisabled : tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.inlineButton, pressed && styles.headerPressed]}
    >
      <Text color={color} style={styles.inlineText}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface InfoNoteProps {
  icon: IconName;
  /** info: mavi bilgi · warning: sarı uyarı (silinecek) · danger: kırmızı engel. */
  tone?: 'info' | 'warning' | 'danger';
  title?: string;
  children?: ReactNode;
}

/** Renkli bilgi kutusu: ikon + (başlık) + metin / içerik. */
export function InfoNote({ icon, tone = 'info', title, children }: InfoNoteProps) {
  const styles = useStyles();
  const colors = useColors();
  const palette =
    tone === 'danger'
      ? { bg: colors.dangerSurface, fg: colors.danger, text: colors.danger }
      : tone === 'warning'
        ? { bg: colors.warningSurface, fg: colors.badges.pending.fg, text: colors.badges.pending.fg }
        : { bg: colors.iconTile, fg: colors.primary, text: colors.text };

  if (!title) {
    return (
      <View style={[styles.note, styles.noteRow, { backgroundColor: palette.bg }]}>
        <Icon name={icon} size={20} color={palette.fg} />
        <View style={styles.texts}>
          {typeof children === 'string' ? (
            <Text color={palette.text} style={styles.noteText}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.note, { backgroundColor: palette.bg }]}>
      <View style={styles.noteTitleRow}>
        <Icon name={icon} size={20} color={palette.fg} />
        <Text color={palette.fg} variant="bodyStrong" style={styles.texts}>
          {title}
        </Text>
      </View>
      {typeof children === 'string' ? (
        <Text color={palette.text} style={styles.noteText}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

/** Baş harf yuvarlağı (üye, profil). */
export function InitialsAvatar({ initials, size = 40 }: { initials: string; size?: number }) {
  const colors = useColors();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.iconTile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        color={colors.primarySoftText}
        style={{ fontFamily: FontFamily.semibold, fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.5) }}
      >
        {initials}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: {
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.md,
  },
  sectionFirst: { paddingTop: Spacing.xs },
  group: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamily.medium, fontSize: 15, lineHeight: 20 },
  pressed: { backgroundColor: c.surface },
  headerAction: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 10 },
  headerActionText: { fontFamily: FontFamily.semibold, fontSize: 16, textAlign: 'right' },
  headerPressed: { opacity: 0.6 },
  inlineButton: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 10 },
  inlineText: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 18 },
  note: { borderRadius: 14, padding: 14, gap: Spacing.sm },
  noteRow: { flexDirection: 'row', gap: 10, paddingVertical: Spacing.md },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  noteText: { fontSize: 14, lineHeight: 20 },
}));
