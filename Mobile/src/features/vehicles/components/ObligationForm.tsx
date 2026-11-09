import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import {
  AmountField,
  Button,
  Card,
  Chip,
  DatePickerSheet,
  FormError,
  FormField,
  SelectSheet,
  SwitchCard,
  Text,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { toNullable, vmsg } from '@/features/auth/validation';
import { PickerField } from '@/features/categories/components/DefinitionKit';
import { useCategoryOptions } from '@/features/categories/hooks';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import type { ApiError } from '@/lib/api';
import { enumLabel, type VehicleObligationType } from '@/lib/domain/enums';
import { amountToInput, parseAmountInput } from '@/lib/format/amountInput';
import { formatDisplayDate, todayIso } from '@/lib/format/period';

import { addYears, OBLIGATION_TYPES } from '../reminders';
import type { VehicleObligation, VehicleObligationFormValues } from '../types';

const schema = z
  .object({
    type: z.enum(['TrafficInsurance', 'Kasko', 'Inspection', 'Mtv', 'Maintenance']),
    date: z.string().min(1, 'validation.required'),
    validUntil: z.string().min(1, 'validation.required'),
    amount: z.string(),
    note: z.string().max(200, vmsg('validation.maxLength', { max: 200 })),
    createExpense: z.boolean(),
    categoryId: z.number().nullable(),
    paymentMethodId: z.number().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.date && v.validUntil && v.validUntil <= v.date) {
      ctx.addIssue({
        code: 'custom',
        path: ['validUntil'],
        message: 'vehicles.form.validUntilAfterDate',
      });
    }
    const amount = parseAmountInput(v.amount);
    if (amount !== null && amount <= 0) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.positive' });
    }
    // Harcama da oluşturulacaksa tutar, kategori ve ödeme aracı zorunlu (backend: expenseFieldsRequired).
    if (v.createExpense) {
      if (amount === null)
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.required' });
      if (v.categoryId === null)
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'validation.required' });
      if (v.paymentMethodId === null) {
        ctx.addIssue({ code: 'custom', path: ['paymentMethodId'], message: 'validation.required' });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

/**
 * Araç işlemi ekle / düzenle (tasarım: Araç işlemi ekle · harcama olarak da kaydet). Bağlı canlı harcaması
 * olan işlemde anahtar gösterilmez; tarih/tutar değişikliği harcamaya yansır.
 */
export function ObligationForm({
  obligation,
  defaultType = 'Inspection',
  pending,
  error,
  onSubmit,
}: {
  obligation?: VehicleObligation;
  defaultType?: VehicleObligationType;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (values: VehicleObligationFormValues) => void;
}) {
  const { t } = useTranslation();
  const categories = useCategoryOptions();
  const paymentMethods = usePaymentMethodOptions();
  const [picker, setPicker] = useState<'date' | 'validUntil' | 'category' | 'paymentMethod' | null>(
    null,
  );
  const today = todayIso();

  const { control, handleSubmit, setValue, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: obligation?.type ?? defaultType,
      date: obligation?.date ?? today,
      validUntil: obligation?.validUntil ?? addYears(today, 1),
      amount: amountToInput(obligation?.amount ?? null, 'TRY'),
      note: obligation?.note ?? '',
      createExpense: false,
      categoryId: null,
      paymentMethodId: null,
    },
  });
  const [date, validUntil, createExpense, categoryId, paymentMethodId] = useWatch({
    control,
    name: ['date', 'validUntil', 'createExpense', 'categoryId', 'paymentMethodId'],
  });
  const linkedExpense = !!obligation?.hasExpense;
  const activeMethods = (paymentMethods.data ?? []).filter((m) => m.isActive);

  const submit = () =>
    handleSubmit((v) =>
      onSubmit({
        type: v.type,
        date: v.date,
        validUntil: v.validUntil,
        amount: parseAmountInput(v.amount),
        note: toNullable(v.note),
        createExpense: !linkedExpense && v.createExpense,
        categoryId: v.categoryId,
        paymentMethodId: v.paymentMethodId,
      }),
    )();

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />

      <View style={styles.field}>
        <Text variant="label" muted>
          {t('vehicles.form.type')}
        </Text>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View style={styles.chips} accessibilityRole="radiogroup">
              {OBLIGATION_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={enumLabel('vehicleObligationType', type)}
                  selected={field.value === type}
                  onPress={() => field.onChange(type)}
                />
              ))}
            </View>
          )}
        />
      </View>

      <View style={styles.pair}>
        <Controller
          control={control}
          name="date"
          render={({ fieldState }) => (
            <View style={styles.flex}>
              <PickerField
                label={t('vehicles.form.date')}
                value={formatDisplayDate(date)}
                icon="calendar-today"
                error={fieldState.error?.message}
                onPress={() => setPicker('date')}
              />
            </View>
          )}
        />
        <Controller
          control={control}
          name="validUntil"
          render={({ fieldState }) => (
            <View style={styles.flex}>
              <PickerField
                label={t('vehicles.form.validUntil')}
                value={formatDisplayDate(validUntil)}
                icon="event"
                error={fieldState.error?.message}
                onPress={() => setPicker('validUntil')}
              />
            </View>
          )}
        />
      </View>

      <View style={styles.field}>
        <Text variant="label" muted>
          {createExpense ? t('vehicles.form.amount') : t('vehicles.form.amountOptional')}
        </Text>
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <AmountField
              variant="inline"
              currency="TRY"
              value={field.value}
              onChangeValue={field.onChange}
              label={t('vehicles.form.amount')}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>

      <FormField
        control={control}
        name="note"
        label={t('vehicles.form.note')}
        placeholder={t('vehicles.form.optional')}
        maxLength={200}
      />

      {linkedExpense ? (
        <Card>
          <Text variant="bodyStrong">{t('vehicles.form.linkedExpenseTitle')}</Text>
          <Text variant="caption" muted>
            {t('vehicles.form.linkedExpenseHint')}
          </Text>
        </Card>
      ) : (
        <View style={styles.field}>
          <Controller
            control={control}
            name="createExpense"
            render={({ field }) => (
              <SwitchCard
                title={t('vehicles.form.createExpense')}
                description={t('vehicles.form.createExpenseHint')}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {createExpense ? (
            <View style={styles.pair}>
              <Controller
                control={control}
                name="categoryId"
                render={({ fieldState }) => (
                  <View style={styles.flex}>
                    <PickerField
                      label={t('vehicles.form.category')}
                      value={categories.data?.find((c) => c.id === categoryId)?.name}
                      placeholder={t('vehicles.form.choose')}
                      error={fieldState.error?.message}
                      onPress={() => setPicker('category')}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="paymentMethodId"
                render={({ fieldState }) => (
                  <View style={styles.flex}>
                    <PickerField
                      label={t('vehicles.form.paymentMethod')}
                      value={paymentMethods.data?.find((m) => m.id === paymentMethodId)?.name}
                      placeholder={t('vehicles.form.choose')}
                      error={fieldState.error?.message}
                      onPress={() => setPicker('paymentMethod')}
                    />
                  </View>
                )}
              />
            </View>
          ) : null}
        </View>
      )}

      <Button title={t('common.save')} loading={pending} onPress={submit} />

      <DatePickerSheet
        visible={picker === 'date' || picker === 'validUntil'}
        onClose={() => setPicker(null)}
        title={picker === 'validUntil' ? t('vehicles.form.validUntil') : t('vehicles.form.date')}
        value={picker === 'validUntil' ? validUntil : date}
        onSelect={(value) => {
          if (picker === 'validUntil') {
            setValue('validUntil', value, { shouldValidate: true });
          } else {
            // Geçerlilik sonu tarihten önce kalırsa bir yıl sonrasına çekilir.
            const shift = getValues('validUntil') <= value;
            setValue('date', value, { shouldValidate: true });
            if (shift) setValue('validUntil', addYears(value, 1), { shouldValidate: true });
          }
        }}
      />
      <SelectSheet<number>
        visible={picker === 'category'}
        onClose={() => setPicker(null)}
        title={t('vehicles.form.category')}
        value={categoryId}
        options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        emptyText={categories.isError ? categories.error.message : undefined}
        onSelect={(v) => setValue('categoryId', v, { shouldValidate: true })}
      />
      <SelectSheet<number>
        visible={picker === 'paymentMethod'}
        onClose={() => setPicker(null)}
        title={t('vehicles.form.paymentMethod')}
        value={paymentMethodId}
        options={activeMethods.map((m) => ({
          value: m.id,
          label: m.name,
          description: [enumLabel('paymentMethodType', m.type), m.ownerPersonName]
            .filter(Boolean)
            .join(' · '),
        }))}
        emptyText={paymentMethods.isError ? paymentMethods.error.message : undefined}
        onSelect={(v) => setValue('paymentMethodId', v, { shouldValidate: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  field: { gap: 6 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pair: { flexDirection: 'row', gap: 10 },
});
