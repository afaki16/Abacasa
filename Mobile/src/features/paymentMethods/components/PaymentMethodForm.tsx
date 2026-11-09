import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Chip, FormError, FormField, SelectSheet, SwitchCard, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { vmsg } from '@/features/auth/validation';
import { PickerField } from '@/features/categories/components/DefinitionKit';
import { usePersonOptions } from '@/features/people/hooks';
import type { ApiError } from '@/lib/api';
import { enumLabel } from '@/lib/domain/enums';

import {
  PAYMENT_METHOD_ICONS,
  PAYMENT_METHOD_TYPES,
  type PaymentMethodFormValues,
} from '../display';
import type { PaymentMethod } from '../types';

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'validation.required')
      .max(100, vmsg('validation.maxLength', { max: 100 })),
    type: z.enum(['Cash', 'BankAccount', 'CreditCard', 'MealCard']),
    bank: z.string().max(100, vmsg('validation.maxLength', { max: 100 })),
    ownerPersonId: z.number().nullable(),
    statementDay: z.string(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== 'CreditCard') return;
    const day = Number(v.statementDay);
    if (!v.statementDay.trim()) {
      ctx.addIssue({ code: 'custom', path: ['statementDay'], message: 'validation.required' });
    } else if (!Number.isInteger(day) || day < 1 || day > 31) {
      ctx.addIssue({
        code: 'custom',
        path: ['statementDay'],
        message: vmsg('validation.range', { min: 1, max: 31 }),
      });
    }
  });

/** Ödeme aracı ekle / düzenle: ad, tür, banka, sahip, kesim günü (kredi kartı), aktiflik (düzenlemede). */
export function PaymentMethodForm({
  method,
  pending,
  error,
  onSubmit,
}: {
  method?: PaymentMethod;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (values: PaymentMethodFormValues) => void;
}) {
  const { t } = useTranslation();
  const people = usePersonOptions();
  const [ownerOpen, setOwnerOpen] = useState(false);
  const { control, handleSubmit, setValue, setFocus } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: method?.name ?? '',
      type: method?.type ?? 'CreditCard',
      bank: method?.bank ?? '',
      ownerPersonId: method?.ownerPersonId ?? null,
      statementDay: method?.statementDay ? String(method.statementDay) : '',
      isActive: method?.isActive ?? true,
    },
  });
  const [type, ownerPersonId] = useWatch({ control, name: ['type', 'ownerPersonId'] });
  const ownerName =
    ownerPersonId === null
      ? t('paymentMethods.shared')
      : (people.data?.find((p) => p.id === ownerPersonId)?.name ?? method?.ownerPersonName ?? '');

  const submit = () => handleSubmit(onSubmit)();

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />
      <FormField
        control={control}
        name="name"
        label={t('paymentMethods.form.name')}
        maxLength={100}
        autoFocus={!method}
        returnKeyType="done"
      />
      <View style={styles.field}>
        <Text variant="label" muted>
          {t('paymentMethods.form.type')}
        </Text>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View style={styles.chips} accessibilityRole="radiogroup">
              {PAYMENT_METHOD_TYPES.map((value) => (
                <Chip
                  key={value}
                  icon={PAYMENT_METHOD_ICONS[value]}
                  label={enumLabel('paymentMethodType', value)}
                  selected={field.value === value}
                  onPress={() => field.onChange(value)}
                />
              ))}
            </View>
          )}
        />
        {type === 'MealCard' ? (
          <Text variant="caption" muted>
            {t('paymentMethods.form.mealCardHint')}
          </Text>
        ) : null}
      </View>
      {type !== 'Cash' ? (
        <FormField
          control={control}
          name="bank"
          label={t('paymentMethods.form.bank')}
          placeholder={t('paymentMethods.form.optional')}
          maxLength={100}
          {...(type === 'CreditCard'
            ? {
                returnKeyType: 'next' as const,
                submitBehavior: 'submit' as const,
                onSubmitEditing: () => setFocus('statementDay'),
              }
            : { returnKeyType: 'done' as const })}
        />
      ) : null}
      {type === 'CreditCard' ? (
        <FormField
          control={control}
          name="statementDay"
          label={t('paymentMethods.form.statementDay')}
          hint={t('paymentMethods.form.statementDayHint')}
          keyboardType="number-pad"
          maxLength={2}
        />
      ) : null}
      <PickerField
        label={t('paymentMethods.form.owner')}
        value={ownerName}
        onPress={() => setOwnerOpen(true)}
      />
      {method ? (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <SwitchCard
              title={t('common.active')}
              description={t('paymentMethods.form.activeHint')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}
      <Button title={t('common.save')} loading={pending} onPress={submit} />
      <SelectSheet<number>
        visible={ownerOpen}
        onClose={() => setOwnerOpen(false)}
        title={t('paymentMethods.form.owner')}
        value={ownerPersonId ?? 0}
        options={[
          { value: 0, label: t('paymentMethods.shared'), icon: 'home' },
          ...(people.data ?? []).map((p) => ({
            value: p.id,
            label: p.name,
            description: p.relation ?? undefined,
          })),
        ]}
        onSelect={(v) => setValue('ownerPersonId', v === 0 ? null : v, { shouldDirty: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  field: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
