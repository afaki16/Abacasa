import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { FundForm } from '@/features/donationFunds/components/FundForm';
import { RequireDonationExtras } from '@/features/donationFunds/components/RequireDonationExtras';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { useCreateDonationFund } from '@/features/donationFunds/hooks';
import { toast } from '@/stores/toastStore';

/** Emanet al (/donation-funds/new). Oluşunca emanetin detayına geçilir. */
export default function NewDonationFundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('donationFunds.newTitle') }} />
      <RequireDonationExtras>
        <RequirePermission permission={DONATION_FUND_PERMISSIONS.CREATE}>
          <NewFund />
        </RequirePermission>
      </RequireDonationExtras>
    </>
  );
}

function NewFund() {
  const { t } = useTranslation();
  const create = useCreateDonationFund();
  return (
    <Screen scroll edges={['bottom']}>
      <FundForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(request) =>
          create.mutate(request, {
            onSuccess: (fund) => {
              toast.success(t('donationFunds.toast.created'));
              router.replace({ pathname: '/donation-funds/[id]', params: { id: String(fund.id) } });
            },
          })
        }
      />
    </Screen>
  );
}
