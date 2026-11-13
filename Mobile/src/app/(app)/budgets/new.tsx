import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { BudgetForm } from '@/features/budgets/components/BudgetForm';
import { BUDGET_PERMISSIONS } from '@/features/budgets/constants';
import { useBudgetReport, useCreateBudget } from '@/features/budgets/hooks';
import { todayIso } from '@/lib/format/period';
import { toast } from '@/stores/toastStore';

/** Bütçe ekle (/budgets/new?year=2026&month=11). */
export default function NewBudgetScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('budgets.newTitle') }} />
      <RequirePermission permission={BUDGET_PERMISSIONS.CREATE}>
        <NewBudget />
      </RequirePermission>
    </>
  );
}

function NewBudget() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const today = todayIso();
  const year = Number(params.year) || Number(today.slice(0, 4));
  const month = Number(params.month) || Number(today.slice(5, 7));
  // Öneri seçili ayın raporundan (Bütçe ekranından gelindiyse önbellekte)
  const report = useBudgetReport(year, month, today);
  const create = useCreateBudget();
  return (
    <Screen scroll edges={['bottom']}>
      <BudgetForm
        defaultYear={year}
        defaultMonth={month}
        suggestion={report.data?.suggestion}
        pending={create.isPending}
        error={create.error}
        onSubmit={(request) =>
          create.mutate(request, {
            onSuccess: () => {
              toast.success(t('budgets.toast.created'));
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
