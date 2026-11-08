import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Card, FormError, ListItem, Screen, StateView, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useSwitchHousehold } from '@/features/auth/hooks';
import type { HouseholdMembership, HouseholdRole } from '@/features/auth/types';
import { useAuthStore } from '@/stores/authStore';

const ROLE_LABEL: Record<HouseholdRole, string> = { Admin: 'Yönetici', Member: 'Üye' };
// Seçici her çağrıda yeni [] döndürmesin (zustand sonsuz render döngüsü); saklı oturumda üyelikler /me ile gelir.
const NO_MEMBERSHIPS: HouseholdMembership[] = [];

/**
 * Geçici ana ekran: aktif hane ve hane değiştirme. Bütçe ekranları (Özet, Harcamalar…)
 * Claude Design tasarımları gelince bu sekmenin yerini alacak.
 */
export default function HomeScreen() {
  const firstName = useAuthStore((s) => s.user?.firstName);
  const activeTenant = useAuthStore((s) => s.user?.activeTenant ?? null);
  const memberships = useAuthStore((s) => s.user?.memberships ?? NO_MEMBERSHIPS);
  const switchHousehold = useSwitchHousehold();

  const others = memberships.filter((m) => m.tenantId !== activeTenant?.id);

  return (
    <Screen scroll edges={['top']} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="heading">Merhaba{firstName ? `, ${firstName}` : ''}</Text>
        <Text muted>Abacasa ile hanenin bütçesi tek yerde.</Text>
      </View>

      {activeTenant ? (
        <Card title="Aktif hane">
          <View style={styles.household}>
            <Ionicons name="home" size={22} color={Colors.primary} />
            <Text variant="title" style={styles.householdName}>
              {activeTenant.name}
            </Text>
            <Text variant="caption" muted>
              {ROLE_LABEL[activeTenant.role] ?? activeTenant.role}
            </Text>
          </View>
        </Card>
      ) : (
        <StateView
          kind="empty"
          title="Henüz bir hanen yok"
          message="Web uygulamasından yeni hane oluşturabilir ya da bir davet bağlantısıyla haneye katılabilirsin."
        />
      )}

      {others.length > 0 && (
        <Card title="Haneye geç" padded={false}>
          <FormError messages={switchHousehold.error?.messages} />
          {others.map((m, i) => (
            <ListItem
              key={m.tenantId}
              icon="swap-horizontal"
              title={m.name}
              subtitle={ROLE_LABEL[m.role] ?? m.role}
              last={i === others.length - 1}
              onPress={switchHousehold.isPending ? undefined : () => switchHousehold.mutate(m.tenantId)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.lg },
  header: { gap: Spacing.xs },
  household: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  householdName: { flex: 1 },
});
