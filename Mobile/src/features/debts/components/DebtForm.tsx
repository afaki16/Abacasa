import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import {
  AmountField,
  Button,
  Card,
  FormError,
  FormField,
  Icon,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { makeStyles, MIN_TOUCH, Radius, Spacing } from '@/constants/theme';
import { usePersonOptions } from '@/features/people/hooks';
import { Labeled } from '@/features/recurringPayments/components/form/Bits';
import {
  DateField,
  SelectField,
  useServerFieldErrors,
} from '@/features/recurringPayments/components/form/Fields';
import type { ApiError } from '@/lib/api';
import type { Currency } from '@/lib/domain/enums';
import { parseAmountInput } from '@/lib/format/amountInput';
import { formatAmount } from '@/lib/format/money';
import { todayIso } from '@/lib/format/period';

import {
  debtFormSchema,
  debtFormToRequest,
  debtToForm,
  stepQuarter,
  type DebtFormValues,
} from '../debtForm';
import type { CreateDebtRequest, DebtListItem } from '../types';

const SERVER_FIELDS = [
  'currency',
  'amount',
  'date',
  'creditorPersonId',
  'debtorPersonId',
  'note',
] as const;
const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'QuarterGold'];

export interface DebtFormProps {
  debt?: DebtListItem;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (request: CreateDebtRequest) => void;
}

/** Borç ekle / düzenle: para birimi (çeyrekte adet), tarih, alacaklı, borçlu, not. Ödemesi olan borcun birimi değişmez. */
export function DebtForm({ debt, pending, error, onSubmit }: DebtFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const people = usePersonOptions();
  const { control, handleSubmit, setError, setValue } = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: debtToForm(debt, todayIso()),
  });
  const restErrors = useServerFieldErrors(error, setError, SERVER_FIELDS);
  const currency = useWatch({ control, name: 'currency' });
  const currencyLocked = !!debt?.hasPayments;

  const personOptions = (people.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
    description: p.relation ?? undefined,
  }));
  const debtorOptions = [{ value: 0, label: t('debts.household') }, ...personOptions];
  const submit = () => handleSubmit((v) => onSubmit(debtFormToRequest(v)))();

  return (
    <View style={styles.container}>
      <FormError messages={restErrors.length ? restErrors : undefined} />
      <Card>
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Labeled
              label={t('debts.fields.currency')}
              hint={currencyLocked ? t('debts.form.currencyLocked') : undefined}
            >
              <SegmentedControl<Currency>
                accessibilityLabel={t('debts.fields.currency')}
                disabled={currencyLocked}
                segments={CURRENCIES.map((c) => ({ value: c, label: t(`debts.currency.${c}`) }))}
                value={field.value}
                onChange={(c) => {
                  field.onChange(c);
                  // Çeyrek tam sayıdır; birim değişince ondalıklı tutar temizlenir.
                  setValue('amount', '');
                }}
              />
            </Labeled>
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) =>
            currency === 'QuarterGold' ? (
              <Labeled
                label={t('debts.fields.count')}
                hint={t('debts.form.quarterHint')}
                error={fieldState.error?.message}
              >
                <View style={styles.stepper}>
                  <StepButton
                    icon="remove"
                    label={t('debts.form.decrease')}
                    onPress={() => field.onChange(stepQuarter(field.value, -1))}
                  />
                  <Text tabular style={styles.count} accessibilityLiveRegion="polite">
                    {formatAmount(Math.trunc(parseAmountInput(field.value) ?? 0), 'QuarterGold')}
                  </Text>
                  <StepButton
                    icon="add"
                    label={t('debts.form.increase')}
                    onPress={() => field.onChange(stepQuarter(field.value, 1))}
                  />
                </View>
              </Labeled>
            ) : (
              <Labeled label={t('debts.fields.amount')}>
                <AmountField
                  variant="inline"
                  currency={currency}
                  label={t('debts.fields.amount')}
                  value={field.value}
                  onChangeValue={field.onChange}
                  error={fieldState.error?.message}
                />
              </Labeled>
            )
          }
        />
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <DateField
              label={t('debts.fields.date')}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="creditorPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('debts.fields.creditor')}
              options={personOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('donations.form.pick')}
              error={fieldState.error?.message}
              emptyText={t('donationFunds.form.noPeople')}
            />
          )}
        />
        <Controller
          control={control}
          name="debtorPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('debts.fields.debtor')}
              options={debtorOptions}
              value={field.value ?? 0}
              onChange={(v) => field.onChange(v === 0 ? null : v)}
              error={fieldState.error?.message}
            />
          )}
        />
        <FormField
          control={control}
          name="note"
          label={t('donations.fields.note')}
          placeholder={t('donations.form.optional')}
          hint={t('debts.form.noteHint')}
          maxLength={200}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </Card>
      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
    >
      <Icon name={icon} size={22} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: Spacing.lg },
  stepper: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    borderRadius: Radius.md,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  step: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 10,
    backgroundColor: c.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { backgroundColor: c.iconTile },
  count: { fontWeight: '700', fontSize: 22, lineHeight: 28 },
}));
