import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Card, FormError, Screen, SwitchCard, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAcceptConsents, useLogout } from '@/features/auth/hooks';
import { LEGAL_DOCUMENTS, openLegalDocument } from '@/features/auth/legal';
import type { ConsentDocument } from '@/features/auth/types';
import { useAuthStore } from '@/stores/authStore';

// Seçici her çağrıda yeni [] döndürmesin (zustand sonsuz render döngüsü).
const NO_PENDING: ConsentDocument[] = [];

/**
 * Yasal metin güncellenince (backend Legal sürümü artınca) kullanıcı bir sonraki girişte yeniden onaylar.
 * Bekleyen onay varken yalnızca bu ekran açılır (kök layout guard'ı). Başarıda yönlendirme yok:
 * bekleyen liste boşalınca guard uygulamaya geçer.
 */
export default function ConsentsScreen() {
  const { t } = useTranslation();
  const pending = useAuthStore((s) => s.user?.pendingConsents ?? NO_PENDING);
  const accept = useAcceptConsents();
  const logout = useLogout();
  const [checked, setChecked] = useState<Partial<Record<ConsentDocument, boolean>>>({});

  const allChecked = pending.every((doc) => checked[doc]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="heading">{t('auth.consents.title')}</Text>
        <Text muted>{t('auth.consents.subtitle')}</Text>
      </View>

      <FormError messages={accept.error?.messages} />

      {pending.map((doc) => (
        <Card key={doc} title={t(LEGAL_DOCUMENTS[doc].titleKey)}>
          <Button title={t('auth.consents.read')} variant="secondary" onPress={() => openLegalDocument(doc)} />
          <SwitchCard
            title={doc === 'Terms' ? t('auth.consents.accept') : t('auth.consents.acknowledge')}
            value={!!checked[doc]}
            onChange={(value) => setChecked((prev) => ({ ...prev, [doc]: value }))}
          />
        </Card>
      ))}

      <Button
        title={t('auth.consents.continue')}
        disabled={!allChecked}
        loading={accept.isPending}
        onPress={() => accept.mutate(pending)}
      />
      <Button title={t('common.logout')} variant="ghost" loading={logout.isPending} onPress={() => logout.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
});
