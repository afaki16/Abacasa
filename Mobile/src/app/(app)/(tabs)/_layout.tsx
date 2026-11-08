import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/components/navigation/TabBar';
import { useColors } from '@/constants/theme';
import { AddSheet } from '@/features/shell/AddSheet';

/**
 * Ana sekmeler: Özet, Harcamalar, ortada "Ekle", Sabit ödemeler, Diğer.
 * "add" bir ekran değildir: sekme çubuğu ona dokununca gezinmez, "Ekle" alttan sayfasını açar
 * (route yalnızca çubukta yuva olsun diye var; doğrudan açılırsa Özet'e yönlendirir).
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} onAddPress={() => setAddOpen(true)} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.overview') }} />
        <Tabs.Screen name="expenses" options={{ title: t('tabs.expenses') }} />
        <Tabs.Screen name="add" options={{ title: t('tabs.add'), tabBarAccessibilityLabel: t('add.title') }} />
        <Tabs.Screen name="recurring" options={{ title: t('tabs.recurring') }} />
        <Tabs.Screen name="more" options={{ title: t('tabs.more') }} />
      </Tabs>
      <AddSheet visible={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
