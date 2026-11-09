import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { CATEGORY_PERMISSIONS } from '@/features/categories/constants';
import { useCreateCategory } from '@/features/categories/hooks';
import { toast } from '@/stores/toastStore';

export default function NewCategoryScreen() {
  return (
    <RequirePermission permission={CATEGORY_PERMISSIONS.CREATE}>
      <NewCategory />
    </RequirePermission>
  );
}

function NewCategory() {
  const { t } = useTranslation();
  const create = useCreateCategory();
  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: t('categories.newTitle') }} />
      <CategoryForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(name) =>
          create.mutate(
            { name },
            {
              onSuccess: () => {
                toast.success(t('categories.created'));
                router.back();
              },
            },
          )
        }
      />
    </Screen>
  );
}
