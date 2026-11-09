import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Chip, FormError, FormField, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { toNullable, vmsg } from '@/features/auth/validation';
import type { ApiError } from '@/lib/api';

import { matchRelation, RELATION_KEYS, type RelationKey } from '../relations';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(100, vmsg('validation.maxLength', { max: 100 })),
  relation: z.string().max(50, vmsg('validation.maxLength', { max: 50 })),
});

export interface PersonFormSubmit {
  name: string;
  relation: string | null;
}

/** Kişi ekle / düzenle (tasarım: Kişi ekle / düzenle): ad + yakınlık çipleri; "Diğer" serbest metin. */
export function PersonForm({
  name,
  relation,
  pending,
  error,
  onSubmit,
}: {
  name?: string;
  relation?: string | null;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (values: PersonFormSubmit) => void;
}) {
  const { t } = useTranslation();
  const labels = Object.fromEntries(
    RELATION_KEYS.map((k) => [k, t(`people.relations.${k}`)]),
  ) as Record<RelationKey, string>;
  const initialPreset = matchRelation(relation, labels);
  const [custom, setCustom] = useState(!!relation?.trim() && initialPreset === null);
  const { control, handleSubmit, setValue, setFocus } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: name ?? '', relation: relation ?? '' },
  });
  const current = useWatch({ control, name: 'relation' });
  const preset = custom ? null : matchRelation(current, labels);

  const submit = () =>
    handleSubmit((v) => onSubmit({ name: v.name.trim(), relation: toNullable(v.relation) }))();

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />
      <FormField
        control={control}
        name="name"
        label={t('people.form.name')}
        maxLength={100}
        autoFocus={!name}
        returnKeyType="done"
      />
      <View style={styles.field}>
        <Text variant="label" muted>
          {t('people.form.relation')}
        </Text>
        <View style={styles.chips}>
          {RELATION_KEYS.map((k) => (
            <Chip
              key={k}
              label={labels[k]}
              selected={preset === k}
              onPress={() => {
                setCustom(false);
                // Seçili çipe tekrar dokunmak yakınlığı temizler.
                setValue('relation', preset === k ? '' : labels[k], { shouldDirty: true });
              }}
            />
          ))}
          <Chip
            label={t('people.relations.other')}
            selected={custom}
            onPress={() => {
              setCustom(true);
              if (preset) setValue('relation', '', { shouldDirty: true });
              setTimeout(() => setFocus('relation'), 0);
            }}
          />
        </View>
      </View>
      {custom ? (
        <FormField
          control={control}
          name="relation"
          label={t('people.form.customRelation')}
          maxLength={50}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      ) : null}
      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  field: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
