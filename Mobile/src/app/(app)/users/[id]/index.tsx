import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, FormError, ListItem, Screen, StateView, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { UserStatusBadge } from '@/features/users/components/UserStatusBadge';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useDeleteUser, useUser } from '@/features/users/hooks';
import { formatDisplayDate } from '@/lib/format/period';
import { useAuthStore } from '@/stores/authStore';

const pad = (n: number) => String(n).padStart(2, '0');

/** Tarih-saat (cihazın saat diliminde): "dd.MM.yyyy HH:mm"; boşsa "—". Tarih kısmı ortak biçimleyiciden. */
const formatDate = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${formatDisplayDate(localDate)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Örnek modül — detay: salt okunur bilgiler + yetkiye göre düzenle / sil. */
export default function UserDetailScreen() {
  return (
    <RequirePermission permission={USER_PERMISSIONS.READ}>
      <UserDetail />
    </RequirePermission>
  );
}

function UserDetail() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const user = useUser(id);
  const remove = useDeleteUser();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const canUpdate = useHasPermission(USER_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(USER_PERMISSIONS.DELETE) && id !== currentUserId;

  if (user.isPending) return <StateView kind="loading" />;
  if (user.isError || !user.data) {
    return (
      <StateView
        kind="error"
        message={user.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => user.refetch()}
      />
    );
  }
  const u = user.data;

  const confirmDelete = () =>
    Alert.alert(t('users.deleteTitle'), t('users.deleteMessage', { name: u.fullName }), [
      { text: t('common.dismiss'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(u.id, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="title">{u.fullName}</Text>
        <UserStatusBadge status={u.status} />
      </View>

      <FormError messages={remove.error?.messages} />

      <Card title={t('common.contact')} padded={false}>
        <ListItem
          icon="mail-outline"
          title={u.email}
          subtitle={u.emailConfirmed ? t('users.emailConfirmed') : t('users.emailNotConfirmed')}
        />
        <ListItem icon="phone" title={u.phoneNumber || '—'} subtitle={t('common.phone')} last />
      </Card>

      <Card title={t('users.accountSection')} padded={false}>
        <ListItem
          icon="verified-user"
          title={u.roles.map((r) => r.name).join(', ') || '—'}
          subtitle={t('users.roles')}
        />
        {u.tenantName ? <ListItem icon="business" title={u.tenantName} subtitle={t('users.tenant')} /> : null}
        <ListItem icon="login" title={formatDate(u.lastLoginDate)} subtitle={t('users.lastLogin')} />
        <ListItem icon="calendar-today" title={formatDate(u.createdDate)} subtitle={t('users.createdAt')} last />
      </Card>

      {canUpdate && (
        <Button
          title={t('common.edit')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/users/[id]/edit', params: { id: String(u.id) } })}
        />
      )}
      {canDelete && (
        <Button title={t('common.delete')} variant="danger" loading={remove.isPending} onPress={confirmDelete} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
});
