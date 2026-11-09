import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NavigatorStackHeader } from '@/components/navigation/StackHeader';
import { useColors } from '@/constants/theme';

/**
 * Girişli kullanıcı ekranları. (tabs) sekmeli ana yapı; diğer ekranlar sekmelerin üstüne açılır
 * ve kitin yığın üst barını (StackHeader) kullanır. Yeni modül ekranları bu grubun altına eklenir.
 * Başlık metinleri dile bağlı; dil ya da tema değişince navigator yeniden çizilir.
 */
const MODAL = { presentation: 'modal' } as const;

export default function AppLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        header: (props) => <NavigatorStackHeader {...props} />,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Ekle / düzenle formları tam ekran açılır: üst barda geri yerine kapat (X). Başlıklar ekranlarda. */}
      <Stack.Screen name="expenses/new" options={MODAL} />
      <Stack.Screen name="expenses/[id]" options={MODAL} />
      <Stack.Screen name="recurring/new" options={MODAL} />
      <Stack.Screen name="recurring/[id]" options={MODAL} />
      <Stack.Screen name="donations/new" options={MODAL} />
      <Stack.Screen name="donations/[id]" options={MODAL} />
      <Stack.Screen name="donation-targets/new" options={MODAL} />
      <Stack.Screen name="donation-targets/[id]" options={MODAL} />
      <Stack.Screen name="donation-funds/new" options={MODAL} />
      <Stack.Screen name="donation-funds/[id]/edit" options={MODAL} />
      <Stack.Screen name="debts/new" options={MODAL} />
      <Stack.Screen name="debts/[id]/edit" options={MODAL} />
      <Stack.Screen name="vehicles/new" options={MODAL} />
      <Stack.Screen name="vehicles/[id]/edit" options={MODAL} />
      <Stack.Screen name="vehicles/[id]/obligations/new" options={MODAL} />
      <Stack.Screen name="vehicles/[id]/obligations/[obligationId]" options={MODAL} />
      <Stack.Screen name="ledger/new" options={MODAL} />
      <Stack.Screen name="ledger/[id]" options={MODAL} />
      <Stack.Screen name="categories/new" options={MODAL} />
      <Stack.Screen name="categories/[id]" options={MODAL} />
      <Stack.Screen name="people/new" options={MODAL} />
      <Stack.Screen name="people/[id]" options={MODAL} />
      <Stack.Screen name="payment-methods/new" options={MODAL} />
      <Stack.Screen name="payment-methods/[id]" options={MODAL} />
      {/* Örnek modül (Kullanıcılar) — yeni modül eklerken Mobile/MODULE_CREATION_GUIDE.md */}
      <Stack.Screen name="users/index" options={{ title: t('users.title') }} />
      <Stack.Screen name="users/new" options={{ title: t('users.newTitle') }} />
      <Stack.Screen name="users/[id]/index" options={{ title: t('users.detailTitle') }} />
      <Stack.Screen name="users/[id]/edit" options={{ title: t('users.editTitle') }} />
    </Stack>
  );
}
