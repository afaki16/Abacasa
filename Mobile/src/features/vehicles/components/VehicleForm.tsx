import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField, next, SelectSheet, SwitchCard } from '@/components/ui';

import { toNullable, vmsg } from '@/features/auth/validation';
import { PickerField } from '@/features/categories/components/DefinitionKit';
import { usePersonOptions } from '@/features/people/hooks';
import type { ApiError } from '@/lib/api';

import type { Vehicle } from '../types';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(100, vmsg('validation.maxLength', { max: 100 })),
  plate: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(20, vmsg('validation.maxLength', { max: 20 })),
  ownerPersonId: z.number().nullable(),
  note: z.string().max(200, vmsg('validation.maxLength', { max: 200 })),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface VehicleFormSubmit {
  name: string;
  plate: string;
  ownerPersonId: number | null;
  note: string | null;
  isActive: boolean;
}

/** Araç ekle / düzenle formu (tasarım: Araç ekle). Aktiflik yalnızca düzenlemede. */
export function VehicleForm({
  vehicle,
  pending,
  error,
  onSubmit,
}: {
  vehicle?: Vehicle;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (values: VehicleFormSubmit) => void;
}) {
  const { t } = useTranslation();
  const people = usePersonOptions();
  const [ownerOpen, setOwnerOpen] = useState(false);
  const { control, handleSubmit, setFocus, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: vehicle?.name ?? '',
      plate: vehicle?.plate ?? '',
      ownerPersonId: vehicle?.ownerPersonId ?? null,
      note: vehicle?.note ?? '',
      isActive: vehicle?.isActive ?? true,
    },
  });
  const ownerPersonId = useWatch({ control, name: 'ownerPersonId' });
  const ownerName =
    ownerPersonId === null
      ? t('vehicles.household')
      : (people.data?.find((p) => p.id === ownerPersonId)?.name ?? vehicle?.ownerName ?? '');

  const submit = () =>
    handleSubmit((v) =>
      onSubmit({
        name: v.name.trim(),
        // Backend büyük harfle saklar; formda da öyle gönderilir.
        plate: v.plate.trim().toLocaleUpperCase('tr-TR'),
        ownerPersonId: v.ownerPersonId,
        note: toNullable(v.note),
        isActive: v.isActive,
      }),
    )();

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />
      <FormField
        control={control}
        name="name"
        label={t('vehicles.form.name')}
        maxLength={100}
        {...next(() => setFocus('plate'))}
      />
      <FormField
        control={control}
        name="plate"
        label={t('vehicles.form.plate')}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={20}
        {...next(() => setFocus('note'))}
      />
      <PickerField
        label={t('vehicles.form.owner')}
        value={ownerName}
        onPress={() => setOwnerOpen(true)}
      />
      <FormField
        control={control}
        name="note"
        label={t('vehicles.form.note')}
        placeholder={t('vehicles.form.optional')}
        maxLength={200}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {vehicle ? (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <SwitchCard
              title={t('common.active')}
              description={t('vehicles.form.activeHint')}
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
        title={t('vehicles.form.owner')}
        value={ownerPersonId ?? 0}
        options={[
          { value: 0, label: t('vehicles.household'), icon: 'home' },
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
});
