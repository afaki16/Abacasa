import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HouseholdBar } from '@/components/navigation/HouseholdBar';
import { OfflineBanner } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { HouseholdSwitcherSheet } from '@/features/household/components/HouseholdSwitcherSheet';
import { queryClient } from '@/lib/api';
import { enumLabel } from '@/lib/domain/enums';
import { useAuthStore } from '@/stores/authStore';

export interface TabScreenProps {
  children: ReactNode;
  /** İçerik kendi listesini kaydırıyorsa (FlashList) false. */
  scroll?: boolean;
}

/**
 * Sekme ekranı kabı: üst safe area + hane barı (dokununca hane seçici) + internet yok bandı + içerik.
 * Alt boşluğu sekme çubuğu verir.
 */
export function TabScreen({ children, scroll = true }: TabScreenProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const activeTenant = useAuthStore((s) => s.user?.activeTenant ?? null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <HouseholdBar
        name={activeTenant?.name ?? t('household.noHousehold')}
        roleLabel={activeTenant ? enumLabel('householdRole', activeTenant.role) : undefined}
        roleVariant={activeTenant?.role === 'Admin' ? 'admin' : 'member'}
        onPress={() => setSwitcherOpen(true)}
      />
      <OfflineBanner onRetry={() => void queryClient.refetchQueries({ type: 'active' })} />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
      <HouseholdSwitcherSheet visible={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((c) => ({
  safeArea: { flex: 1, backgroundColor: c.background },
  fill: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xl, gap: Spacing.md },
}));
