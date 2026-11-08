import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, FormError, ListItem, Screen, StateView, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useDeleteUser, useUser } from '@/features/users/hooks';
import { useAuthStore } from '@/stores/authStore';

const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : '—');

/** Örnek modül — detay: salt okunur bilgiler + yetkiye göre düzenle / sil. */
export default function UserDetailScreen() {
  return (
    <RequirePermission permission={USER_PERMISSIONS.READ}>
      <UserDetail />
    </RequirePermission>
  );
}

function UserDetail() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const user = useUser(id);
  const remove = useDeleteUser();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const canUpdate = useHasPermission(USER_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(USER_PERMISSIONS.DELETE) && id !== currentUserId;

  if (user.isPending) return <StateView kind="loading" />;
  if (user.isError || !user.data) {
    return <StateView kind="error" message={user.error?.message} actionLabel="Tekrar dene" onAction={() => user.refetch()} />;
  }
  const u = user.data;

  const confirmDelete = () =>
    Alert.alert('Kullanıcıyı sil', `${u.fullName} silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove.mutate(u.id, { onSuccess: () => router.back() }) },
    ]);

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="title">{u.fullName}</Text>
        <UserStatusBadge status={u.status} />
      </View>

      <FormError messages={remove.error?.messages} />

      <Card title="İletişim" padded={false}>
        <ListItem icon="mail-outline" title={u.email} subtitle={u.emailConfirmed ? 'E-posta doğrulandı' : 'E-posta doğrulanmadı'} />
        <ListItem icon="call-outline" title={u.phoneNumber || '—'} subtitle="Telefon" last />
      </Card>

      <Card title="Hesap" padded={false}>
        <ListItem icon="shield-checkmark-outline" title={u.roles.map((r) => r.name).join(', ') || '—'} subtitle="Roller" />
        {u.tenantName ? <ListItem icon="business-outline" title={u.tenantName} subtitle="Tenant" /> : null}
        <ListItem icon="log-in-outline" title={formatDate(u.lastLoginDate)} subtitle="Son giriş" />
        <ListItem icon="calendar-outline" title={formatDate(u.createdDate)} subtitle="Oluşturulma" last />
      </Card>

      {canUpdate && (
        <Button
          title="Düzenle"
          variant="secondary"
          onPress={() => router.push({ pathname: '/users/[id]/edit', params: { id: String(u.id) } })}
        />
      )}
      {canDelete && <Button title="Sil" variant="danger" loading={remove.isPending} onPress={confirmDelete} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
});
