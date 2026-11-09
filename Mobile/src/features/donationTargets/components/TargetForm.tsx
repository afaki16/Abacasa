import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AmountField, Button, Card, FormError, FormField } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { yearOptions } from '@/features/donations/summary';
import { usePersonOptions } from '@/features/people/hooks';
import { Labeled } from '@/features/recurringPayments/components/form/Bits';
import {
  SelectField,
  useServerFieldErrors,
} from '@/features/recurringPayments/components/form/Fields';
import type { ApiError } from '@/lib/api';
import { DonationKind, enumOptions } from '@/lib/domain/enums';

import {
  targetFormSchema,
  targetFormToRequest,
  targetToForm,
  type TargetFormValues,
} from '../report';
import type { CreateDonationTargetRequest, DonationTarget } from '../types';

const SERVER_FIELDS = ['year', 'kind', 'ownerPersonId', 'amount', 'note'] as const;

export interface TargetFormProps {
  target?: DonationTarget;
  defaultYear: number;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (request: CreateDonationTargetRequest) => void;
}

/** Bağış hedefi ekle / düzenle: yıl, tür, kimin hedefi (hane ya da kişi), tutar, not. */
export function TargetForm({ target, defaultYear, pending, error, onSubmit }: TargetFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const people = usePersonOptions();
  const { control, handleSubmit, setError } = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: targetToForm(target, defaultYear),
  });
  const restErrors = useServerFieldErrors(error, setError, SERVER_FIELDS);
  const currentYear = new Date().getFullYear();
  const years = yearOptions(currentYear);
  if (target && !years.includes(target.year)) years.push(target.year);

  const personOptions = [
    { value: 0, label: t('donations.household') },
    ...(people.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      description: p.relation ?? undefined,
    })),
  ];
  const submit = () => handleSubmit((v) => onSubmit(targetFormToRequest(v)))();

  return (
    <View style={styles.container}>
      <FormError messages={restErrors.length ? restErrors : undefined} />
      <Card>
        <Controller
          control={control}
          name="year"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('donationTargets.fields.year')}
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
          name="kind"
          render={({ field, fieldState }) => (
            <SelectField<DonationKind>
              label={t('donationTargets.fields.kind')}
              options={enumOptions('donationKind', DonationKind)}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('donations.form.pick')}
              error={fieldState.error?.message}
              searchable={false}
            />
          )}
        />
        <Controller
          control={control}
          name="ownerPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('donationTargets.fields.owner')}
              options={personOptions}
              value={field.value ?? 0}
              onChange={(v) => field.onChange(v === 0 ? null : v)}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <Labeled label={t('donationTargets.fields.amount')}>
              <AmountField
                variant="inline"
                currency="TRY"
                label={t('donationTargets.fields.amount')}
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
      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { gap: Spacing.lg },
}));
