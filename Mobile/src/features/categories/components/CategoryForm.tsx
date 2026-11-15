import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField, Icon, Text } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { vmsg } from '@/features/auth/validation';
import { CATEGORY_ICON_KEYS, categoryIcon } from '@/features/expenses/icons';
import type { ApiError } from '@/lib/api';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(100, vmsg('validation.maxLength', { max: 100 })),
});

export interface CategoryFormValues {
  name: string;
  /** Boşsa ikon addan tahmin edilir. */
  icon: string | null;
}

/** Kategori ekle / düzenle: ad ve ikon. */
export function CategoryForm({
  name,
  icon,
  pending,
  error,
  onSubmit,
}: {
  name?: string;
  icon?: string | null;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (values: CategoryFormValues) => void;
}) {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: name ?? '' },
  });
  const [selectedIcon, setSelectedIcon] = useState<string | null>(icon ?? null);
  const submit = () => handleSubmit((v) => onSubmit({ name: v.name.trim(), icon: selectedIcon }))();

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />
      <FormField
        control={control}
        name="name"
        label={t('categories.form.name')}
        maxLength={100}
        autoFocus={!name}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <IconPicker value={selectedIcon} onChange={setSelectedIcon} disabled={pending} />
      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

/** İkon ızgarası; ilk seçenek "otomatik" (addan tahmin). */
function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const s = useStyles();
  const options: (string | null)[] = [null, ...CATEGORY_ICON_KEYS];

  return (
    <View style={s.picker}>
      <Text variant="label" muted>
        {t('categories.form.icon')}
      </Text>
      <View style={s.grid} accessibilityRole="radiogroup">
        {options.map((key) => {
          const selected = value === key;
          return (
            <Pressable
              key={key ?? 'auto'}
              accessibilityRole="radio"
              accessibilityLabel={key ?? t('categories.form.iconAuto')}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(key)}
              style={({ pressed }) => [s.cell, selected && s.cellSelected, pressed && s.pressed]}
            >
              {key ? (
                <Icon
                  name={categoryIcon(null, key)}
                  size={22}
                  color={selected ? colors.primarySoftText : colors.textMuted}
                />
              ) : (
                <Text
                  variant="caption"
                  color={selected ? colors.primarySoftText : colors.textMuted}
                >
                  {t('categories.form.iconAutoShort')}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" muted>
        {t('categories.form.iconHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
});

const useStyles = makeStyles((c) => ({
  picker: { gap: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cell: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.fieldBorder,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { borderColor: c.primarySoftBorder, backgroundColor: c.primarySoft },
  pressed: { opacity: 0.7 },
}));
