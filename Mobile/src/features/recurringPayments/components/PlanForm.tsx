import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { type Control, Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import {
  AmountField,
  Button,
  Card,
  FormError,
  FormField,
  SegmentedControl,
  SwitchCard,
  Text,
} from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { useCategoryOptions } from '@/features/categories/hooks';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import { usePersonOptions } from '@/features/people/hooks';
import type { ApiError } from '@/lib/api';
import { DonationKind, enumLabel, enumOptions } from '@/lib/domain/enums';
import { parseAmountInput } from '@/lib/format/amountInput';
import { formatMoney } from '@/lib/format/money';
import { todayIso } from '@/lib/format/period';

import {
  DUE_DAY_MAX,
  emptyPlanForm,
  INSTALLMENT_MAX,
  INSTALLMENT_MIN,
  installmentAmount,
  kindFromChoice,
  planFormSchema,
  planFormToRequest,
  planToForm,
  type MonthlyExpenseKind,
  type PlanFormValues,
  type PlanGroup,
  type PlanSchedule,
} from '../planForm';
import type { CreateRecurringPaymentRequest, RecurringPaymentListItem } from '../types';
import { Labeled } from './form/Bits';
import { DateField, SelectField, useServerFieldErrors } from './form/Fields';
import { MonthStepper } from './form/MonthStepper';

const SERVER_FIELDS = [
  'name',
  'paymentMethodId',
  'ownerPersonId',
  'categoryId',
  'donationKind',
  'recipient',
  'dueDay',
  'expectedAmount',
  'totalAmount',
  'installmentCount',
  'firstDueDate',
] as const;

const DUE_DAYS = Array.from({ length: DUE_DAY_MAX }, (_, i) => i + 1);

export interface PlanFormProps {
  /** Düzenlemede mevcut plan; yoksa oluşturma. */
  plan?: RecurringPaymentListItem;
  pending: boolean;
  error: ApiError | null;
  submitLabel: string;
  onSubmit: (request: CreateRecurringPaymentRequest, isActive: boolean) => void;
}

/** Plan ekle / düzenle: türe göre alanlar (aylık: başlangıç ayı, vade günü, beklenen tutar; taksit: toplam, sayı, ilk tarih). */
export function PlanForm({ plan, pending, error, submitLabel, onSubmit }: PlanFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const categories = useCategoryOptions();
  const methods = usePaymentMethodOptions();
  const people = usePersonOptions();
  const locked = !!plan?.hasPayments;

  const { control, handleSubmit, setFocus, setError } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan ? planToForm(plan, todayIso()) : emptyPlanForm(todayIso()),
  });
  const restErrors = useServerFieldErrors(error, setError, SERVER_FIELDS, {
    kind: 'group',
    startMonth: 'startYear',
  });

  const group = useWatch({ control, name: 'group' });
  const schedule = useWatch({ control, name: 'schedule' });
  const monthlyKind = useWatch({ control, name: 'monthlyKind' });
  const totalRaw = useWatch({ control, name: 'totalAmount' });
  const countRaw = useWatch({ control, name: 'installmentCount' });
  const kind = kindFromChoice(group, schedule, monthlyKind);
  const installment = kind === 'Installment';
  const donation = kind === 'Donation';
  const perInstallment = installmentAmount(parseAmountInput(totalRaw), Number(countRaw) || null);

  // Pasif ödeme aracı yeni kayıtta seçilmez; düzenlemede mevcut araç listede kalır.
  const methodOptions = (methods.data ?? [])
    .filter((m) => m.isActive || m.id === plan?.paymentMethodId)
    .map((m) => ({
      value: m.id,
      label: m.name,
      description: [
        enumLabel('paymentMethodType', m.type),
        m.ownerPersonName,
        m.isActive ? null : t('common.inactive'),
      ]
        .filter(Boolean)
        .join(' · '),
    }));
  const categoryOptions = (categories.data ?? []).map((c) => ({ value: c.id, label: c.name }));
  // 0: hane (kişi seçilmedi).
  const personOptions = [
    { value: 0, label: t('recurring.fields.household') },
    ...(people.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      description: p.relation ?? undefined,
    })),
  ];

  const submit = () => handleSubmit((v) => onSubmit(planFormToRequest(v), v.isActive))();
  const lockHint = locked ? t('recurring.form.lockedHint') : undefined;

  return (
    <View style={styles.container}>
      <FormError messages={restErrors.length ? restErrors : undefined} />

      <Card title={t('recurring.form.planSection')}>
        <FormField
          control={control}
          name="name"
          label={t('recurring.fields.name')}
          placeholder={t('recurring.form.namePlaceholder')}
          maxLength={100}
          returnKeyType="done"
        />
        <Controller
          control={control}
          name="group"
          render={({ field }) => (
            <Labeled label={t('recurring.fields.group')} hint={lockHint}>
              <SegmentedControl<PlanGroup>
                accessibilityLabel={t('recurring.fields.group')}
                disabled={locked}
                segments={[
                  { value: 'expense', label: t('recurring.group.expense') },
                  { value: 'donation', label: t('recurring.group.donation') },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            </Labeled>
          )}
        />
        {group === 'expense' ? (
          <Controller
            control={control}
            name="schedule"
            render={({ field }) => (
              <Labeled label={t('recurring.fields.schedule')}>
                <SegmentedControl<PlanSchedule>
                  accessibilityLabel={t('recurring.fields.schedule')}
                  disabled={locked}
                  segments={[
                    { value: 'monthly', label: t('recurring.schedule.monthly') },
                    { value: 'installment', label: t('recurring.schedule.installment') },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              </Labeled>
            )}
          />
        ) : null}
        {group === 'expense' && schedule === 'monthly' ? (
          <Controller
            control={control}
            name="monthlyKind"
            render={({ field }) => (
              <Labeled label={t('recurring.fields.monthlyKind')}>
                <SegmentedControl<MonthlyExpenseKind>
                  accessibilityLabel={t('recurring.fields.monthlyKind')}
                  disabled={locked}
                  segments={[
                    { value: 'Bill', label: enumLabel('recurringPaymentKind', 'Bill') },
                    {
                      value: 'Subscription',
                      label: enumLabel('recurringPaymentKind', 'Subscription'),
                    },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              </Labeled>
            )}
          />
        ) : null}
      </Card>

      <Card title={t('recurring.form.scheduleSection')}>
        {installment ? (
          <>
            <Controller
              control={control}
              name="totalAmount"
              render={({ field, fieldState }) => (
                <Labeled label={t('recurring.fields.totalAmount')}>
                  <AmountField
                    variant="inline"
                    currency="TRY"
                    label={t('recurring.fields.totalAmount')}
                    value={field.value}
                    onChangeValue={field.onChange}
                    error={fieldState.error?.message}
                  />
                </Labeled>
              )}
            />
            <FormField
              control={control}
              name="installmentCount"
              label={t('recurring.fields.installmentCount')}
              hint={
                locked
                  ? lockHint
                  : t('recurring.form.installmentCountHint', {
                      min: INSTALLMENT_MIN,
                      max: INSTALLMENT_MAX,
                    })
              }
              keyboardType="number-pad"
              maxLength={3}
              editable={!locked}
            />
            <Controller
              control={control}
              name="firstDueDate"
              render={({ field, fieldState }) => (
                <DateField
                  label={t('recurring.fields.firstDueDate')}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('recurring.form.pickDate')}
                  error={fieldState.error?.message}
                  disabled={locked}
                  hint={lockHint}
                />
              )}
            />
            {perInstallment !== null ? (
              <View style={styles.preview} accessible>
                <Text variant="label" muted style={styles.flex}>
                  {t('recurring.form.monthlyInstallment')}
                </Text>
                <Text variant="bodyStrong" tabular>
                  {formatMoney(perInstallment)}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <StartMonthField control={control} />
            <Controller
              control={control}
              name="dueDay"
              render={({ field, fieldState }) => (
                <SelectField<number>
                  label={t('recurring.fields.dueDay')}
                  options={DUE_DAYS.map((d) => ({ value: d, label: String(d) }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('recurring.form.pickDueDay')}
                  error={fieldState.error?.message}
                  hint={t('recurring.form.dueDayHint')}
                  searchable={false}
                />
              )}
            />
            <Controller
              control={control}
              name="expectedAmount"
              render={({ field, fieldState }) => (
                <Labeled
                  label={t('recurring.fields.expectedAmount')}
                  hint={t('recurring.form.expectedAmountHint')}
                >
                  <AmountField
                    variant="inline"
                    currency="TRY"
                    label={t('recurring.fields.expectedAmount')}
                    value={field.value}
                    onChangeValue={field.onChange}
                    error={fieldState.error?.message}
                  />
                </Labeled>
              )}
            />
          </>
        )}
      </Card>

      <Card title={t('recurring.form.detailsSection')}>
        {donation ? (
          <>
            <Controller
              control={control}
              name="donationKind"
              render={({ field, fieldState }) => (
                <SelectField<DonationKind>
                  label={t('recurring.fields.donationKind')}
                  options={enumOptions('donationKind', DonationKind)}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('recurring.form.pick')}
                  error={fieldState.error?.message}
                  searchable={false}
                />
              )}
            />
            <FormField
              control={control}
              name="recipient"
              label={t('recurring.fields.recipient')}
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={() => setFocus('name')}
            />
          </>
        ) : (
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <SelectField<number>
                label={t('recurring.fields.category')}
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('recurring.form.pick')}
                error={fieldState.error?.message}
              />
            )}
          />
        )}
        <Controller
          control={control}
          name="paymentMethodId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('recurring.fields.paymentMethod')}
              options={methodOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('recurring.form.pick')}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="ownerPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={donation ? t('recurring.fields.giver') : t('recurring.fields.person')}
              options={personOptions}
              value={field.value ?? 0}
              onChange={(v) => field.onChange(v === 0 ? null : v)}
              error={fieldState.error?.message}
            />
          )}
        />
      </Card>

      {plan ? (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <SwitchCard
              title={t('recurring.fields.isActive')}
              description={t('recurring.form.isActiveHint')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}

      <Button title={submitLabel} loading={pending} onPress={submit} />
    </View>
  );
}

/** Başlangıç ayı: iki alan (yıl, ay) tek ay seçicide. */
function StartMonthField({ control }: { control: Control<PlanFormValues> }) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="startYear"
      render={({ field: yearField, fieldState }) => (
        <Controller
          control={control}
          name="startMonth"
          render={({ field: monthField }) => (
            <Labeled label={t('recurring.fields.startMonth')} error={fieldState.error?.message}>
              <MonthStepper
                variant="field"
                year={yearField.value}
                month={monthField.value}
                onChange={({ year, month }) => {
                  yearField.onChange(year);
                  monthField.onChange(month);
                }}
              />
            </Labeled>
          )}
        />
      )}
    />
  );
}

const useStyles = makeStyles((c) => ({
  container: { gap: Spacing.lg },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  flex: { flex: 1 },
}));
