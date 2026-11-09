import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { DefinitionDeleteButton } from '@/features/categories/components/DefinitionList';
import { CATEGORY_PERMISSIONS } from '@/features/categories/constants';
import { useCategory, useDeleteCategory, useUpdateCategory } from '@/features/categories/hooks';
import { toast } from '@/stores/toastStore';

/** Kategori düzenle (Update) / sil (Delete); kullanımdaki kategori için "silinemez" penceresi. */
export default function EditCategoryScreen() {
  return (
    <RequirePermission permission={CATEGORY_PERMISSIONS.READ}>
      <EditCategory />
    </RequirePermission>
  );
}

function EditCategory() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const category = useCategory(id);
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const canUpdate = useHasPermission(CATEGORY_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(CATEGORY_PERMISSIONS.DELETE);

  if (category.isPending) return <StateView kind="loading" />;
  if (category.isError || !category.data) {
    return (
      <ErrorState
        title={t('common.error')}
        message={category.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void category.refetch()}
      />
    );
  }
  const c = category.data;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: canUpdate ? t('categories.editTitle') : c.name }} />
      {canUpdate ? (
        <CategoryForm
          name={c.name}
          pending={update.isPending}
          error={update.error}
          onSubmit={(name) =>
            update.mutate(
              { id, name },
              {
                onSuccess: () => {
                  toast.success(t('categories.saved'));
                  router.back();
                },
              },
            )
          }
        />
      ) : null}
      {canDelete ? (
        <DefinitionDeleteButton
          label={t('categories.delete')}
          confirmTitle={t('categories.deleteTitle')}
          confirmMessage={t('categories.deleteMessage', { name: c.name })}
          inUseTitle={t('categories.inUseTitle', { name: c.name })}
          pending={remove.isPending}
          onDelete={(handlers) => remove.mutate(id, handlers)}
          onDeleted={() => {
            toast.success(t('categories.deleted'));
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}
