import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SegmentedControl, Text } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { SectionLabel, SettingsGroup, SettingsRow } from '@/features/account/components/SettingsKit';
import { LEGAL_DOCUMENTS, openLegalDocument } from '@/features/auth/legal';
import type { ConsentDocument } from '@/features/auth/types';
import { toast } from '@/stores/toastStore';
import { SUPPORTED_LOCALES, usePreferencesStore, type ThemeMode } from '@/stores/preferencesStore';

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const LEGAL: ConsentDocument[] = ['Terms', 'PrivacyNotice'];
const LANGUAGE_NAMES = { tr: 'Türkçe', en: 'English' } as const;

/** "1.0.0 (142)": sürüm app.config'ten; build numarası varsa (yerel build'de olmayabilir). */
function appVersion(): string {
  const config = Constants.expoConfig;
  const version = config?.version ?? '1.0.0';
  const build = Platform.OS === 'ios' ? config?.ios?.buildNumber : config?.android?.versionCode;
  return build ? `${version} (${build})` : version;
}

/** Ayarlar: dil (Türkçe / English), tema (Açık / Koyu / Sistem), yasal metinler, uygulama sürümü. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  // Dil ve tema anında uygulanır: i18n ve useColors() tercih store'unu dinler.
  const locale = usePreferencesStore((s) => s.locale);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const openLegal = (doc: ConsentDocument) =>
    openLegalDocument(doc).catch(() => toast.error(t('settingsScreen.legalOpenFailed')));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}
    >
      <Stack.Screen options={{ title: t('settingsScreen.title') }} />
      <SectionLabel label={t('settingsScreen.language')} first />
      <SegmentedControl
        accessibilityLabel={t('settingsScreen.language')}
        segments={SUPPORTED_LOCALES.map((value) => ({ value, label: LANGUAGE_NAMES[value] }))}
        value={locale}
        onChange={(value) => void setLocale(value)}
      />
      <SectionLabel label={t('settingsScreen.theme')} />
      <SegmentedControl
        accessibilityLabel={t('settingsScreen.theme')}
        segments={THEME_MODES.map((value) => ({ value, label: t(`settingsScreen.themes.${value}`) }))}
        value={themeMode}
        onChange={(value) => void setThemeMode(value)}
      />
      <SectionLabel label={t('settingsScreen.legal')} />
      <SettingsGroup>
        {LEGAL.map((doc, i) => (
          <SettingsRow
            key={doc}
            first={i === 0}
            external
            title={t(LEGAL_DOCUMENTS[doc].titleKey)}
            accessibilityHint={t('settingsScreen.opensInBrowser')}
            onPress={() => void openLegal(doc)}
          />
        ))}
      </SettingsGroup>
      <View style={styles.spacer} />
      <View style={styles.footer}>
        <Image source={require('@/assets/images/icon.png')} style={styles.icon} accessible={false} />
        <Text variant="label" muted>
          {t('settingsScreen.version', { version: appVersion() })}
        </Text>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },
  spacer: { flexGrow: 1, minHeight: Spacing.xl },
  footer: { alignItems: 'center', gap: Spacing.sm },
  icon: { width: 36, height: 36, borderRadius: 10 },
}));
