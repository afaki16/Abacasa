import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { useCreateExpense } from '@/features/expenses/hooks';
import { toast } from '@/stores/toastStore';

/** Harcama ekle (hızlı giriş): tam ekran, sol üstte kapat. "Ekle" sayfasından ve Özet boş durumundan açılır. */
export default function NewExpenseScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('expenses.newTitle'), presentation: 'modal' }} />
      <RequirePermission permission={EXPENSE_PERMISSIONS.CREATE}>
        <NewExpense />
      </RequirePermission>
    </>
  );
}

function NewExpense() {
  const { t } = useTranslation();
  const create = useCreateExpense();

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.content}>
      <ExpenseForm
        variant="quick"
        onSave={create.mutateAsync}
        onSaved={(andNew) => {
          if (andNew) {
            toast.success(t('expenses.toast.createdAddNext'));
          } else {
            toast.success(t('expenses.toast.created'));
            router.back();
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: 0 },
});
