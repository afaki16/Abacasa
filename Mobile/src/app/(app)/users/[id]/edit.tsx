import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { UserForm } from '@/features/users/components/UserForm';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useUpdateUser, useUser } from '@/features/users/hooks';
import { useAuthStore } from '@/stores/authStore';

export default function EditUserScreen() {
  return (
    <RequirePermission permission={USER_PERMISSIONS.UPDATE}>
      <EditUser />
    </RequirePermission>
  );
}

function EditUser() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const user = useUser(id);
  const update = useUpdateUser();
  const isSelf = useAuthStore((s) => s.user?.id === id);

  if (user.isPending) return <StateView kind="loading" />;
  if (user.isError || !user.data) return <StateView kind="error" message={user.error?.message} />;

  return (
    <Screen scroll edges={['bottom']}>
      <UserForm
        user={user.data}
        isSelf={isSelf}
        pending={update.isPending}
        error={update.error}
        submitLabel={t('common.save')}
        onSubmit={(v) =>
          update.mutate(
            {
              id,
              firstName: v.firstName,
              lastName: v.lastName,
              email: v.email,
              phoneNumber: v.phoneNumber,
              status: v.status,
              // Kendi hesabı için gönderilmez (backend 403 döner).
              mustChangePassword: isSelf ? undefined : v.mustChangePassword,
              roleIds: v.roleIds,
            },
            { onSuccess: () => router.back() },
          )
        }
      />
    </Screen>
  );
}
