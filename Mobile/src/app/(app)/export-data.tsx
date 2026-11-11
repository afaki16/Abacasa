import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { ACCOUNT_ENDPOINTS } from '@/features/account/api';
import { InfoNote, SettingsGroup } from '@/features/account/components/SettingsKit';
import { useFileDownload } from '@/lib/files/useFileDownload';

const ITEMS = ['profile', 'expenses', 'debts', 'sessions'] as const;

/**
 * Verilerimi indir: hesap bilgileri ve hanelerdeki kayıtlar tek Excel dosyasında (GET /api/Auth/account/export).
 * Dosya oturum token'ıyla indirilir, önbelleğe yazılır ve sistem paylaşma menüsü açılır (lib/files).
 */
export default function ExportDataScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const download = useFileDownload();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}>
      <Stack.Screen options={{ title: t('accountScreen.export.title') }} />
      <Text muted style={styles.intro}>
        {t('accountScreen.export.intro')}
      </Text>
      <SettingsGroup>
        {ITEMS.map((key, i) => (
          <View key={key} style={[styles.item, i > 0 && styles.divider]}>
            <Icon name="check-circle" size={20} color={colors.badges.paid.fg} />
            <Text style={styles.itemText}>{t(`accountScreen.export.items.${key}`)}</Text>
          </View>
        ))}
      </SettingsGroup>
      <View style={styles.format}>
        <Text variant="label" muted style={styles.formatLabel}>
          {t('accountScreen.export.format')}
        </Text>
        <Text variant="label" style={styles.formatValue}>
          {t('accountScreen.export.formatValue')}
        </Text>
      </View>
      <InfoNote icon="ios-share">{t('accountScreen.export.shareHint')}</InfoNote>
      <View style={styles.spacer} />
      <Button
        title={t('accountScreen.export.submit')}
        icon="download"
        loading={download.isPending}
        onPress={() =>
          download.mutate({
            url: ACCOUNT_ENDPOINTS.EXPORT,
            fallbackName: 'abacasa-verilerim.xlsx',
            dialogTitle: t('accountScreen.export.title'),
          })
        }
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background, paddingHorizontal: 20, paddingTop: Spacing.xs, gap: 14 },
  intro: { fontSize: 15, lineHeight: 22 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingHorizontal: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  itemText: { flex: 1, fontFamily: FontFamily.medium },
  format: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: c.surface,
  },
  formatLabel: { fontSize: 14 },
  formatValue: { fontFamily: FontFamily.semibold, fontSize: 14 },
  spacer: { flex: 1 },
}));
