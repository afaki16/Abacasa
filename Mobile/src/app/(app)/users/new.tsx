import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { UserForm } from '@/features/users/components/UserForm';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useCreateUser } from '@/features/users/hooks';

export default function NewUserScreen() {
  return (
    <RequirePermission permission={USER_PERMISSIONS.CREATE}>
      <NewUser />
    </RequirePermission>
  );
}

function NewUser() {
  const { t } = useTranslation();
  const create = useCreateUser();

  return (
    <Screen scroll edges={['bottom']}>
      <UserForm
        pending={create.isPending}
        error={create.error}
        submitLabel={t('users.create')}
        onSubmit={(v) =>
          create.mutate(v, {
            // Oluşturulan kaydın detayına geç; geri tuşu listeye döner.
            onSuccess: (user) => router.replace({ pathname: '/users/[id]', params: { id: String(user.id) } }),
          })
        }
      />
    </Screen>
  );
}
