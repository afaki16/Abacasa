import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { PersonForm } from '@/features/people/components/PersonForm';
import { PERSON_PERMISSIONS } from '@/features/people/constants';
import { useCreatePerson } from '@/features/people/hooks';
import { toast } from '@/stores/toastStore';

export default function NewPersonScreen() {
  return (
    <RequirePermission permission={PERSON_PERMISSIONS.CREATE}>
      <NewPerson />
    </RequirePermission>
  );
}

function NewPerson() {
  const { t } = useTranslation();
  const create = useCreatePerson();
  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('people.newTitle') }} />
      <PersonForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              toast.success(t('people.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
