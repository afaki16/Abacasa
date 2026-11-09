import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { TargetForm } from '@/features/donationTargets/components/TargetForm';
import { DONATION_TARGET_PERMISSIONS } from '@/features/donationTargets/constants';
import { useCreateDonationTarget } from '@/features/donationTargets/hooks';
import { toast } from '@/stores/toastStore';

/** Hedef ekle (/donation-targets/new?year=2026). */
export default function NewDonationTargetScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationTargets.newTitle') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_TARGET_PERMISSIONS.CREATE}>
          <NewTarget />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function NewTarget() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ year?: string }>();
  const year = Number(params.year) || new Date().getFullYear();
  const create = useCreateDonationTarget();
  return (
    <Screen scroll edges={['bottom']}>
      <TargetForm
        defaultYear={year}
        pending={create.isPending}
        error={create.error}
        onSubmit={(request) =>
          create.mutate(request, {
            onSuccess: () => {
              toast.success(t('donationTargets.toast.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
