import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ConfirmDialog, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { DonationForm } from '@/features/donations/components/DonationForm';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import { useDeleteDonation, useDonation, useUpdateDonation } from '@/features/donations/hooks';
import { toast } from '@/stores/toastStore';

/** Bağış düzenle (/donations/[id]) + sil. Düzenleme izni yoksa yalnızca silme düğmesi görünür. */
export default function EditDonationScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donations.editTitle') }} />
      <RequirePermission permission={DONATION_PERMISSIONS.READ}>
        <EditDonation />
      </RequirePermission>
    </>
  );
}

function EditDonation() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const donation = useDonation(id);
  const update = useUpdateDonation();
  const remove = useDeleteDonation();
  const canUpdate = useHasPermission(DONATION_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(DONATION_PERMISSIONS.DELETE);
  const [confirming, setConfirming] = useState(false);

  if (donation.isPending) return <StateView kind="loading" />;
  if (donation.isError || !donation.data) {
    return (
      <StateView
        kind="error"
        message={donation.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void donation.refetch()}
      />
    );
  }
  const d = donation.data;
  if (!canUpdate && !canDelete) return <StateView kind="forbidden" />;

  return (
    <Screen scroll edges={['bottom']}>
      {canUpdate ? (
        <DonationForm
          key={d.id}
          donation={d}
          pending={update.isPending}
          error={update.error}
          onSubmit={(request) =>
            update.mutate(
              { ...request, id: d.id },
              {
                onSuccess: () => {
                  toast.success(t('donations.toast.updated'));
                  router.back();
                },
              },
            )
          }
        />
      ) : null}
      {canDelete ? (
        <Button
          title={t('donations.delete')}
          variant="danger"
          onPress={() => setConfirming(true)}
        />
      ) : null}
      <ConfirmDialog
        visible={confirming}
        title={t('donations.deleteTitle')}
        message={t('donations.deleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(d.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(t('donations.toast.deleted'));
              router.back();
            },
            onError: (e) => {
              setConfirming(false);
              toast.error(e.message);
            },
          })
        }
      />
    </Screen>
  );
}
