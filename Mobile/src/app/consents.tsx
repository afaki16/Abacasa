import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Checkbox, FormError, Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { TextLink } from '@/features/auth/components/AuthParts';
import { AuthLogo } from '@/features/auth/components/AuthLogo';
import { useAcceptConsents, useLogout } from '@/features/auth/hooks';
import { LEGAL_DOCUMENTS, openLegalDocument } from '@/features/auth/legal';
import type { ConsentDocument } from '@/features/auth/types';
import { useAuthStore } from '@/stores/authStore';

// Seçici her çağrıda yeni [] döndürmesin (zustand sonsuz render döngüsü).
const NO_PENDING: ConsentDocument[] = [];

/**
 * Yasal metin güncellenince (backend Legal sürümü artınca) kullanıcı bir sonraki girişte yeniden onaylar.
 * Bekleyen onay varken yalnızca bu ekran açılır (kök layout guard'ı) — kapatılamaz, geri dönüş yok;
 * tek çıkış "Çıkış yap". Başarıda yönlendirme yok: bekleyen liste boşalınca guard uygulamaya geçer.
 * Metnin tamamı web sayfasında (cihaz tarayıcısında) açılır.
 */
export default function ConsentsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const pending = useAuthStore((s) => s.user?.pendingConsents ?? NO_PENDING);
  const accept = useAcceptConsents();
  const logout = useLogout();
  const [checked, setChecked] = useState<Partial<Record<ConsentDocument, boolean>>>({});

  const allChecked = pending.length > 0 && pending.every((doc) => checked[doc]);
  const single = pending.length === 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <AuthLogo width={84} />
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" style={styles.title}>
            {single
              ? t('consentScreen.titleSingle', { document: t(LEGAL_DOCUMENTS[pending[0]].titleKey) })
              : t('consentScreen.titleMultiple')}
          </Text>
          <Text muted>{single ? t('consentScreen.subtitleSingle') : t('consentScreen.subtitleMultiple')}</Text>

          {pending.map((doc) => (
            <View key={doc} style={styles.document}>
              <View style={styles.documentHead}>
                <Icon name="description" size={20} color={colors.primary} />
                <Text style={styles.documentTitle}>{t(LEGAL_DOCUMENTS[doc].titleKey)}</Text>
              </View>
              <Text variant="label" muted>
                {t('consentScreen.readHint')}
              </Text>
              <TextLink
                title={t('consentScreen.read')}
                onPress={() => void openLegalDocument(doc)}
                style={styles.readLink}
              />
            </View>
          ))}

          {pending.map((doc) => (
            <Checkbox
              key={doc}
              label={doc === 'Terms' ? t('consentScreen.acceptTerms') : t('consentScreen.acknowledgePrivacy')}
              checked={!!checked[doc]}
              onChange={(value) => setChecked((prev) => ({ ...prev, [doc]: value }))}
            />
          ))}

          <FormError messages={accept.error?.messages} />
        </ScrollView>

        <View style={styles.actions}>
          <Button
            title={t('consentScreen.submit')}
            disabled={!allChecked}
            loading={accept.isPending}
            onPress={() => accept.mutate(pending)}
          />
          <TextLink
            title={t('common.logout')}
            muted
            disabled={logout.isPending || accept.isPending}
            onPress={() => logout.mutate()}
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.background },
  top: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },
  sheet: {
    flex: 1,
    backgroundColor: c.card,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: Spacing.xl - 4,
    shadowColor: c.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  scroll: { paddingTop: Spacing.xl, gap: 14 },
  title: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28 },
  document: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    backgroundColor: c.background,
    padding: 14,
    gap: Spacing.xs,
  },
  documentHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  documentTitle: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  readLink: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  actions: { gap: Spacing.xs, paddingTop: Spacing.md },
}));
