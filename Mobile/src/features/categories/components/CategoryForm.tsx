import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, FormError, FormField } from '@/components/ui';
import { vmsg } from '@/features/auth/validation';
import type { ApiError } from '@/lib/api';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(100, vmsg('validation.maxLength', { max: 100 })),
});

/** Kategori ekle / düzenle (yalnızca ad). */
export function CategoryForm({
  name,
  pending,
  error,
  onSubmit,
}: {
  name?: string;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (name: string) => void;
}) {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: name ?? '' },
  });
  const submit = () => handleSubmit((v) => onSubmit(v.name.trim()))();

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
      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
});
