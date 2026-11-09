import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AmountField, Button, Card, FormError, FormField } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { usePersonOptions } from '@/features/people/hooks';
import { Labeled } from '@/features/recurringPayments/components/form/Bits';
import {
  DateField,
  SelectField,
  useServerFieldErrors,
} from '@/features/recurringPayments/components/form/Fields';
import type { ApiError } from '@/lib/api';
import { DonationKind, enumOptions } from '@/lib/domain/enums';
import { todayIso } from '@/lib/format/period';

import { fundFormSchema, fundFormToRequest, fundToForm, type FundFormValues } from '../fundForm';
import type { CreateDonationFundRequest, DonationFund } from '../types';

const SERVER_FIELDS = ['fromPersonId', 'kind', 'amount', 'date', 'note'] as const;

export interface FundFormProps {
  fund?: DonationFund;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (request: CreateDonationFundRequest) => void;
}

/** Emanet al / düzenle: kimden, tür, tutar, tarih, not. Dağıtımı olan emanetin türü değiştirilemez (backend). */
export function FundForm({ fund, pending, error, onSubmit }: FundFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const people = usePersonOptions();
  const { control, handleSubmit, setError } = useForm<FundFormValues>({
    resolver: zodResolver(fundFormSchema),
    defaultValues: fundToForm(fund, todayIso()),
  });
  const restErrors = useServerFieldErrors(error, setError, SERVER_FIELDS);
  const kindLocked = !!fund && fund.distributionCount > 0;
  const personOptions = (people.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
    description: p.relation ?? undefined,
  }));
  const submit = () => handleSubmit((v) => onSubmit(fundFormToRequest(v)))();

  return (
    <View style={styles.container}>
      <FormError messages={restErrors.length ? restErrors : undefined} />
      <Card>
        <Controller
          control={control}
          name="fromPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('donationFunds.fields.from')}
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
          name="kind"
          render={({ field, fieldState }) => (
            <SelectField<DonationKind>
              label={t('donationFunds.fields.kind')}
              options={enumOptions('donationKind', DonationKind)}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('donations.form.pick')}
              error={fieldState.error?.message}
              disabled={kindLocked}
              hint={kindLocked ? t('donationFunds.form.kindLocked') : undefined}
              searchable={false}
            />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <Labeled label={t('donationFunds.fields.amount')}>
              <AmountField
                variant="inline"
                currency="TRY"
                label={t('donationFunds.fields.amount')}
                value={field.value}
                onChangeValue={field.onChange}
                error={fieldState.error?.message}
              />
            </Labeled>
          )}
        />
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <DateField
              label={t('donationFunds.fields.date')}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
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
