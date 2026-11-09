import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Screen, StateView } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { ROUTES } from '@/features/dashboard/links';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { useExpense, useUpdateExpense } from '@/features/expenses/hooks';
import { toast } from '@/stores/toastStore';

/** Harcamayı düzenle. "Kaydet ve yeni ekle" kaydedip boş hızlı giriş ekranına geçer. */
export default function EditExpenseScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('expenses.editTitle') }} />
      <RequirePermission permission={EXPENSE_PERMISSIONS.UPDATE}>
        <EditExpense />
      </RequirePermission>
    </>
  );
}

function EditExpense() {
  const { t } = useTranslation();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const expense = useExpense(id);
  const update = useUpdateExpense();

  if (expense.isPending) return <StateView kind="loading" />;
  if (expense.isError || !expense.data) {
    return (
      <StateView
        kind="error"
        message={expense.error?.message}
        actionLabel={t('common.retry')}
        onAction={() => void expense.refetch()}
      />
    );
  }

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.content}>
      <ExpenseForm
        // Başka bir kayda geçilirse form o kaydın değerleriyle yeniden kurulsun.
        key={expense.data.id}
        variant="full"
        expense={expense.data}
        onSave={(request) => update.mutateAsync({ ...request, id })}
        onSaved={(andNew) => {
          toast.success(t('expenses.toast.updated'));
          if (andNew) router.replace(ROUTES.newExpense as Href);
          else router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
});
