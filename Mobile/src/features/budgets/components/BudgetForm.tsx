import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { AmountField, Button, Card, FormError, FormField, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { yearOptions } from '@/features/donations/summary';
import { usePersonOptions } from '@/features/people/hooks';
import { Labeled } from '@/features/recurringPayments/components/form/Bits';
import { SelectField, useServerFieldErrors } from '@/features/recurringPayments/components/form/Fields';
import type { ApiError } from '@/lib/api';
import { amountToInput } from '@/lib/format/amountInput';
import { formatMoney } from '@/lib/format/money';
import { monthName } from '@/lib/format/period';

import { budgetFormSchema, budgetFormToRequest, budgetToForm, type BudgetFormValues } from '../form';
import type { Budget, BudgetReport, CreateBudgetRequest } from '../types';

const SERVER_FIELDS = ['ownerPersonId', 'startYear', 'startMonth', 'amount', 'note'] as const;

export interface BudgetFormProps {
  budget?: Budget;
  defaultYear: number;
  defaultMonth: number;
  /** Yıllık tablodan öneri (yalnızca hane bütçesinde gösterilir). */
  suggestion?: BudgetReport['suggestion'];
  pending: boolean;
  error: ApiError | null;
  onSubmit: (request: CreateBudgetRequest) => void;
}

/** Bütçe ekle / düzenle: kimin bütçesi (hane ya da kişi), hangi aydan itibaren, aylık tutar, not. */
export function BudgetForm({ budget, defaultYear, defaultMonth, suggestion, pending, error, onSubmit }: BudgetFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const people = usePersonOptions();
  const { control, handleSubmit, setError, setValue } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: budgetToForm(budget, defaultYear, defaultMonth),
  });
  const restErrors = useServerFieldErrors(error, setError, SERVER_FIELDS);
  const owner = useWatch({ control, name: 'ownerPersonId' });
  const years = yearOptions(new Date().getFullYear());
  if (budget && !years.includes(budget.startYear)) years.push(budget.startYear);

  const personOptions = [
    { value: 0, label: t('donations.household') },
    ...(people.data ?? []).map((p) => ({ value: p.id, label: p.name, description: p.relation ?? undefined })),
  ];
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) }));
  const submit = () => handleSubmit((v) => onSubmit(budgetFormToRequest(v)))();
  const income = suggestion?.income ?? null;

  return (
    <View style={styles.container}>
      <FormError messages={restErrors.length ? restErrors : undefined} />
      <Text variant="label" muted>
        {t('budgets.formIntro')}
      </Text>
      <Card>
        <Controller
          control={control}
          name="ownerPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('budgets.fields.owner')}
              options={personOptions}
              value={field.value ?? 0}
              onChange={(v) => field.onChange(v === 0 ? null : v)}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="startMonth"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('budgets.fields.startMonth')}
              options={monthOptions}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              searchable={false}
            />
          )}
        />
        <Controller
          control={control}
          name="startYear"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('budgets.fields.startYear')}
              options={years.map((y) => ({ value: y, label: String(y) }))}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              searchable={false}
            />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <Labeled label={t('budgets.fields.amount')} hint={t('budgets.amountHint')}>
              <AmountField
                variant="inline"
                currency="TRY"
                label={t('budgets.fields.amount')}
                value={field.value}
                onChangeValue={field.onChange}
                error={fieldState.error?.message}
              />
            </Labeled>
          )}
        />
        <FormField
          control={control}
          name="note"
          label={t('donations.fields.note')}
          placeholder={t('donations.form.optional')}
          maxLength={200}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </Card>

      {owner == null && suggestion && income !== null ? (
        <View style={[styles.suggestion, { backgroundColor: colors.primarySoft }]}>
          <Text variant="bodyStrong" color={colors.primarySoftText}>
            {t('budgets.suggestion.title')}
          </Text>
          <Text variant="label" tabular color={colors.primarySoftText}>
            {t(suggestion.incomeIsAverage ? 'budgets.suggestion.incomeAverage' : 'budgets.suggestion.income', {
              amount: formatMoney(income),
            })}
          </Text>
          <Text variant="label" tabular color={colors.primarySoftText}>
            {t('budgets.suggestion.fixed', { amount: formatMoney(suggestion.fixedPayments) })}
          </Text>
          <Text variant="label" tabular color={colors.primarySoftText}>
            {t('budgets.suggestion.variable', { amount: formatMoney(suggestion.variableRoom ?? 0) })}
          </Text>
          <Button
            title={t('budgets.suggestion.use', { amount: formatMoney(income) })}
            variant="secondary"
            onPress={() => setValue('amount', amountToInput(income, 'TRY'), { shouldValidate: true })}
          />
        </View>
      ) : null}

      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { gap: Spacing.lg },
  suggestion: { borderRadius: Radius.lg, padding: 14, gap: 6 },
}));
