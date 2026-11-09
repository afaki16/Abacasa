// Giriş ekranlarının küçük ortak parçaları: başlık bloğu, bilgi bandı, adım çubuğu, metin bağlantısı,
// bağlantılı onay kutusu.

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { FontFamily, makeStyles, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';

import { splitAroundMarker } from '../passwordRules';

/** Ekran başlığı + açıklama (24/26 px kalın başlık, 15 px soluk açıklama). */
export function AuthHeader({ title, subtitle, center }: { title: string; subtitle?: ReactNode; center?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, center && styles.center]}>
        {title}
      </Text>
      {subtitle ? (
        <Text muted style={[styles.subtitle, center && styles.center]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Bilgi bandı (ana renk yumuşak zemin + info ikonu). */
export function InfoBanner({ children, icon = 'info' }: { children: ReactNode; icon?: IconName }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.banner}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

/** "Adım 1 / 3" + üç parçalı ilerleme çubuğu. */
export function StepProgress({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const label = t('authScreens.step', { current, total });
  return (
    <View
      style={styles.step}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      <Text variant="label" muted style={styles.stepLabel}>
        {label}
      </Text>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i < current && styles.segmentDone]} />
        ))}
      </View>
    </View>
  );
}

/** Ana renkli metin bağlantısı (Şifremi unuttum, Kayıt ol, Girişe dön); dokunma alanı ≥ 44. */
export function TextLink({
  title,
  onPress,
  disabled,
  muted,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const colors = useColors();
  const color = disabled ? colors.textDisabled : muted ? colors.textMuted : colors.primary;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <Text color={color} style={styles.linkText} tabular>
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * Onay kutusu; metnin içinde belgeyi açan bağlantı var ("Kullanım koşulları'nı okudum…").
 * Kutu ve metin onayı değiştirir, bağlantı belgeyi açar (ayrı erişilebilirlik öğesi).
 */
export function LinkedCheckbox({
  checked,
  onChange,
  template,
  linkLabel,
  onLinkPress,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** t(key, { link: INLINE_MARKER }) sonucu: bağlantının yeri işaretli metin. */
  template: string;
  linkLabel: string;
  onLinkPress: () => void;
  error?: boolean;
}) {
  const styles = useStyles();
  const [before, after] = splitAroundMarker(template);
  const colors = useColors();
  return (
    <View style={styles.checkRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${before}${linkLabel}${after}`}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        hitSlop={11}
        style={({ pressed }) => [styles.box, checked && styles.boxChecked, error && !checked && styles.boxError, pressed && styles.pressed]}
      >
        {checked ? <Icon name="check" size={18} color={colors.onPrimary} /> : null}
      </Pressable>
      <Text muted style={styles.checkText} onPress={() => onChange(!checked)} accessible={false}>
        {before}
        <Text
          color={colors.primary}
          style={styles.inlineLink}
          onPress={onLinkPress}
          accessible
          accessibilityRole="link"
          accessibilityLabel={linkLabel}
        >
          {linkLabel}
        </Text>
        {after}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: { gap: 6 },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 30 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  center: { textAlign: 'center' },
  banner: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: c.iconTile,
  },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 20 },
  step: { gap: Spacing.sm },
  stepLabel: { fontFamily: FontFamily.semibold },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.disabledSurface },
  segmentDone: { backgroundColor: c.primary },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xs },
  linkText: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  pressed: { opacity: 0.6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: MIN_TOUCH },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.textDisabled,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: c.primary, borderColor: c.primary },
  boxError: { borderColor: c.danger },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20, paddingVertical: Spacing.xs },
  inlineLink: { fontFamily: FontFamily.semibold },
}));
