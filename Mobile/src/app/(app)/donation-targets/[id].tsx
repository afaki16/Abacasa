import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ConfirmDialog, Screen, StateView } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { TargetForm } from '@/features/donationTargets/components/TargetForm';
import { DONATION_TARGET_PERMISSIONS } from '@/features/donationTargets/constants';
import {
  useDeleteDonationTarget,
  useDonationTarget,
  useUpdateDonationTarget,
} from '@/features/donationTargets/hooks';
import { toast } from '@/stores/toastStore';

/** Hedef düzenle (/donation-targets/[id]) + sil. */
export default function EditDonationTargetScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationTargets.editTitle') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_TARGET_PERMISSIONS.READ}>
          <EditTarget />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function EditTarget() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const target = useDonationTarget(id);
  const update = useUpdateDonationTarget();
  const remove = useDeleteDonationTarget();
  const canUpdate = useHasPermission(DONATION_TARGET_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(DONATION_TARGET_PERMISSIONS.DELETE);
  const [confirming, setConfirming] = useState(false);

  if (target.isPending) return <StateView kind="loading" />;
  if (target.isError || !target.data) {
    return (
      <StateView
        kind="error"
        message={target.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void target.refetch()}
      />
    );
  }
  if (!canUpdate && !canDelete) return <StateView kind="forbidden" />;
  const tg = target.data;

  return (
    <Screen scroll edges={['bottom']}>
      {canUpdate ? (
        <TargetForm
          key={tg.id}
          target={tg}
          defaultYear={tg.year}
          pending={update.isPending}
          error={update.error}
          onSubmit={(request) =>
            update.mutate(
              { ...request, id: tg.id },
              {
                onSuccess: () => {
                  toast.success(t('donationTargets.toast.updated'));
                  router.back();
                },
              },
            )
          }
        />
      ) : null}
      {canDelete ? (
        <Button
          title={t('donationTargets.delete')}
          variant="danger"
          onPress={() => setConfirming(true)}
        />
      ) : null}
      <ConfirmDialog
        visible={confirming}
        title={t('donationTargets.deleteTitle')}
        message={t('donationTargets.deleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(tg.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(t('donationTargets.toast.deleted'));
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
