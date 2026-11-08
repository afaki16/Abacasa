import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Card, ListItem, Screen, Text } from '@/components/ui';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useLogout } from '@/features/auth/hooks';
import { useHasPermission } from '@/features/auth/permissions';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useAuthStore } from '@/stores/authStore';

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toLocaleUpperCase('tr-TR') || '?';
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const canManageUsers = useHasPermission(USER_PERMISSIONS.READ);

  const confirmLogout = () =>
    Alert.alert('Çıkış yap', 'Bu cihazdaki oturumun kapatılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text color={Colors.onPrimary} style={styles.avatarText}>
            {initials(user?.firstName, user?.lastName)}
          </Text>
        </View>
        <View style={styles.headerTexts}>
          <Text variant="title" numberOfLines={1}>
            {user?.fullName}
          </Text>
          <Text muted numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>

      <Card title="Hesap" padded={false}>
        <ListItem icon="person-outline" title="Hesap bilgileri" onPress={() => router.push('/account')} />
        <ListItem icon="key-outline" title="Şifre değiştir" onPress={() => router.push('/change-password')} />
        <ListItem
          icon="phone-portrait-outline"
          title="Oturumlarım"
          subtitle="Hesabının açık olduğu cihazlar"
          last
          onPress={() => router.push('/sessions')}
        />
      </Card>

      {canManageUsers && (
        <Card title="Yönetim" padded={false}>
          <ListItem icon="people-outline" title="Kullanıcılar" last onPress={() => router.push('/users')} />
        </Card>
      )}

      <Card padded={false}>
        <ListItem icon="log-out-outline" title="Çıkış yap" destructive last onPress={confirmLogout} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  headerTexts: { flex: 1, gap: 2 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.title, fontWeight: '700' },
});
