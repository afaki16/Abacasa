import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { DefinitionDeleteButton } from '@/features/categories/components/DefinitionList';
import { PersonForm } from '@/features/people/components/PersonForm';
import { PERSON_PERMISSIONS } from '@/features/people/constants';
import { useDeletePerson, usePerson, useUpdatePerson } from '@/features/people/hooks';
import { toast } from '@/stores/toastStore';

/** Kişiyi düzenle (Update) / sil (Delete); kullanımdaki kişi için "silinemez" penceresi. */
export default function EditPersonScreen() {
  return (
    <RequirePermission permission={PERSON_PERMISSIONS.READ}>
      <EditPerson />
    </RequirePermission>
  );
}

function EditPerson() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const person = usePerson(id);
  const update = useUpdatePerson();
  const remove = useDeletePerson();
  const canUpdate = useHasPermission(PERSON_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(PERSON_PERMISSIONS.DELETE);

  if (person.isPending) return <StateView kind="loading" />;
  if (person.isError || !person.data) {
    return (
      <ErrorState
        title={t('common.error')}
        message={person.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void person.refetch()}
      />
    );
  }
  const p = person.data;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: canUpdate ? t('people.editTitle') : p.name }} />
      {canUpdate ? (
        <PersonForm
          name={p.name}
          relation={p.relation}
          pending={update.isPending}
          error={update.error}
          onSubmit={(values) =>
            update.mutate(
              { id, ...values },
              {
                onSuccess: () => {
                  toast.success(t('people.saved'));
                  router.back();
                },
              },
            )
          }
        />
      ) : null}
      {canDelete ? (
        <DefinitionDeleteButton
          label={t('people.delete')}
          confirmTitle={t('people.deleteTitle')}
          confirmMessage={t('people.deleteMessage', { name: p.name })}
          inUseTitle={t('people.inUseTitle', { name: p.name })}
          pending={remove.isPending}
          onDelete={(handlers) => remove.mutate(id, handlers)}
          onDeleted={() => {
            toast.success(t('people.deleted'));
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}
