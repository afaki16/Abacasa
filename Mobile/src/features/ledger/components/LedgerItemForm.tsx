import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import {
  Button,
  FormError,
  FormField,
  SegmentedControl,
  SelectSheet,
  SwitchCard,
  Text,
} from '@/components/ui';
import { FontFamily, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';
import { vmsg } from '@/features/auth/validation';
import { PickerField } from '@/features/categories/components/DefinitionKit';
import { usePersonOptions } from '@/features/people/hooks';
import type { ApiError } from '@/lib/api';
import { enumLabel, LedgerDirection } from '@/lib/domain/enums';
import { monthName, monthShortName } from '@/lib/format/period';

import { applyFirstToAll, inputsToMonths, monthsToInputs } from '../itemForm';
import type { LedgerItem } from '../types';

import { MonthAmountCell } from './MonthAmountCell';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(100, vmsg('validation.maxLength', { max: 100 })),
  direction: z.enum(['Income', 'Expense']),
  ownerPersonId: z.number().nullable(),
  isActive: z.boolean(),
  months: z.array(z.string()).length(12),
});

type FormValues = z.infer<typeof schema>;

export interface LedgerItemFormSubmit {
  name: string;
  direction: LedgerDirection;
  ownerPersonId: number | null;
  isActive: boolean;
  /** 12 ay; null = girilmemiş. */
  months: (number | null)[];
}

export interface LedgerItemFormProps {
  /** Düzenlemede kalem; yoksa oluşturma. */
  item?: LedgerItem;
  year: number;
  /** Yılın kayıtlı aylık değerleri (düzenlemede). */
  initialMonths: (number | null)[];
  /** Ledger.Update yoksa aylık tutarlar salt okunur. */
  canEditAmounts: boolean;
  /** Yeni kalemde varsayılan yön. */
  defaultDirection?: LedgerDirection;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (values: LedgerItemFormSubmit) => void;
}

/** Elle gelir/gider kalemi formu (tasarım: Gelir kalemi ekle / düzenle). */
export function LedgerItemForm({
  item,
  year,
  initialMonths,
  canEditAmounts,
  defaultDirection = 'Income',
  pending,
  error,
  onSubmit,
}: LedgerItemFormProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const people = usePersonOptions();
  const [personOpen, setPersonOpen] = useState(false);

  const { control, handleSubmit, setValue, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      direction: item?.direction ?? defaultDirection,
      ownerPersonId: item?.ownerPersonId ?? null,
      isActive: item?.isActive ?? true,
      months: monthsToInputs(initialMonths),
    },
  });
  const ownerPersonId = useWatch({ control, name: 'ownerPersonId' });
  const ownerName =
    ownerPersonId === null
      ? t('ledger.form.household')
      : (people.data?.find((p) => p.id === ownerPersonId)?.name ?? item?.ownerName ?? '');

  const submit = () =>
    handleSubmit((v) =>
      onSubmit({
        name: v.name.trim(),
        direction: v.direction,
        ownerPersonId: v.ownerPersonId,
        isActive: v.isActive,
        months: inputsToMonths(v.months),
      }),
    )();

  // Tutarı olan kalemin yönü değişmez (backend de reddeder).
  const directionLocked = !!item?.hasAmounts;

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />
      <FormField
        control={control}
        name="name"
        label={t('ledger.form.name')}
        maxLength={100}
        returnKeyType="done"
      />

      <View style={styles.pair}>
        <View style={styles.flex}>
          <Text variant="label" muted style={styles.label}>
            {t('ledger.form.direction')}
          </Text>
          <Controller
            control={control}
            name="direction"
            render={({ field }) => (
              <SegmentedControl
                accessibilityLabel={t('ledger.form.direction')}
                segments={[
                  { value: LedgerDirection.Income, label: enumLabel('ledgerDirection', 'Income') },
                  {
                    value: LedgerDirection.Expense,
                    label: enumLabel('ledgerDirection', 'Expense'),
                  },
                ]}
                value={field.value}
                onChange={field.onChange}
                disabled={directionLocked}
              />
            )}
          />
        </View>
        <View style={styles.flex}>
          <PickerField
            label={t('ledger.form.person')}
            value={ownerName}
            onPress={() => setPersonOpen(true)}
          />
        </View>
      </View>
      {directionLocked ? (
        <Text variant="caption" muted>
          {t('ledger.form.directionLocked')}
        </Text>
      ) : null}

      <View style={styles.monthsHeader}>
        <Text style={styles.monthsTitle} muted>
          {t('ledger.form.monthlyAmounts', { year })}
        </Text>
        {canEditAmounts ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setValue('months', applyFirstToAll(getValues('months')), { shouldDirty: true })
            }
            style={({ pressed }) => [styles.applyAll, pressed && styles.pressed]}
          >
            <Text color={colors.primary} style={styles.applyAllText}>
              {t('ledger.form.applyFirst', { month: monthName(1) })}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {!canEditAmounts ? (
        <Text variant="caption" muted>
          {t('ledger.form.amountsReadOnly')}
        </Text>
      ) : null}
      <View style={styles.grid}>
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {[rowIndex * 2, rowIndex * 2 + 1].map((i) => (
              <Controller
                key={i}
                control={control}
                name={`months.${i}`}
                render={({ field }) => (
                  <MonthAmountCell
                    label={monthShortName(i + 1)}
                    accessibilityLabel={`${monthName(i + 1)} ${year}`}
                    value={field.value}
                    onChangeValue={field.onChange}
                    editable={canEditAmounts}
                  />
                )}
              />
            ))}
          </View>
        ))}
      </View>

      {item ? (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <SwitchCard
              title={t('common.active')}
              description={t('ledger.form.activeHint')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}

      <Button title={t('common.save')} loading={pending} onPress={submit} />

      <SelectSheet<number>
        visible={personOpen}
        onClose={() => setPersonOpen(false)}
        title={t('ledger.form.person')}
        value={ownerPersonId ?? 0}
        options={[
          { value: 0, label: t('ledger.form.household'), icon: 'home' },
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
  container: { gap: Spacing.md },
  flex: { flex: 1 },
  pair: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  label: { marginBottom: 6 },
  monthsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  monthsTitle: { fontFamily: FontFamily.semibold, fontSize: 13, flexShrink: 1 },
  applyAll: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  applyAllText: { fontFamily: FontFamily.semibold, fontSize: 14, textAlign: 'right' },
  pressed: { opacity: 0.6 },
  grid: { gap: Spacing.sm },
  gridRow: { flexDirection: 'row', gap: 10 },
});
