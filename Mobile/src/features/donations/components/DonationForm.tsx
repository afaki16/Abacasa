import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { type Control, Controller, useForm, type UseFormSetValue, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { AmountField, Button, Card, FormError, FormField, SwitchCard } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { hasPermission } from '@/features/auth/permissions';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { useDonationFundsInfinite } from '@/features/donationFunds/hooks';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import { usePersonOptions } from '@/features/people/hooks';
import {
  DateField,
  SelectField,
  useServerFieldErrors,
} from '@/features/recurringPayments/components/form/Fields';
import { flattenPages, type ApiError } from '@/lib/api';
import { DonationKind, enumLabel, enumOptions } from '@/lib/domain/enums';
import { formatMoney } from '@/lib/format/money';
import { todayIso } from '@/lib/format/period';
import { useAuthStore } from '@/stores/authStore';

import {
  donationFormSchema,
  donationFormToRequest,
  donationToForm,
  emptyDonationForm,
  type DonationFormValues,
} from '../donationForm';
import type { CreateDonationRequest, DonationListItem } from '../types';

const SERVER_FIELDS = [
  'amount',
  'date',
  'kind',
  'recipient',
  'giverPersonId',
  'paymentMethodId',
  'note',
  'fundId',
] as const;

export interface DonationFormProps {
  donation?: DonationListItem;
  /** Emanet detayından "bu emanetten bağış ver" ile gelindiyse. */
  initialFund?: { id: number; kind: DonationKind } | null;
  pending: boolean;
  error: ApiError | null;
  onSubmit: (request: CreateDonationRequest) => void;
}

/** Bağış ekle / düzenle. "Emanetten ver" yalnızca hanede ek modüller (donationExtras) açıkken görünür. */
export function DonationForm({
  donation,
  initialFund,
  pending,
  error,
  onSubmit,
}: DonationFormProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const methods = usePaymentMethodOptions();
  const people = usePersonOptions();
  const fundsEnabled = useAuthStore(
    (s) =>
      !!s.user?.activeTenant?.modules.donationExtras &&
      hasPermission(s.user, DONATION_FUND_PERMISSIONS.READ),
  );

  const { control, handleSubmit, setFocus, setError, setValue } = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: donation ? donationToForm(donation) : emptyDonationForm(todayIso(), initialFund),
  });
  const restErrors = useServerFieldErrors(error, setError, SERVER_FIELDS);
  const fromFund = useWatch({ control, name: 'useFund' });
  const fundId = useWatch({ control, name: 'fundId' });

  const methodOptions = (methods.data ?? [])
    .filter((m) => m.isActive || m.id === donation?.paymentMethodId)
    .map((m) => ({
      value: m.id,
      label: m.name,
      description: [enumLabel('paymentMethodType', m.type), m.ownerPersonName]
        .filter(Boolean)
        .join(' · '),
    }));
  const personOptions = [
    { value: 0, label: t('donations.household') },
    ...(people.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      description: p.relation ?? undefined,
    })),
  ];
  const showFund = fundsEnabled || fromFund;

  const submit = () => handleSubmit((v) => onSubmit(donationFormToRequest(v)))();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountField
            variant="hero"
            currency="TRY"
            value={field.value}
            onChangeValue={field.onChange}
            error={fieldState.error?.message}
            autoFocus={!donation}
          />
        )}
      />
      <FormError messages={restErrors.length ? restErrors : undefined} />

      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Controller
              control={control}
              name="date"
              render={({ field, fieldState }) => (
                <DateField
                  label={t('donations.fields.date')}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
          <View style={styles.flex}>
            <Controller
              control={control}
              name="kind"
              render={({ field, fieldState }) => (
                <SelectField<DonationKind>
                  label={t('donations.fields.kind')}
                  options={enumOptions('donationKind', DonationKind)}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('donations.form.pick')}
                  error={fieldState.error?.message}
                  disabled={fromFund && fundId != null}
                  searchable={false}
                />
              )}
            />
          </View>
        </View>
        <FormField
          control={control}
          name="recipient"
          label={t('donations.fields.recipient')}
          placeholder={t('donations.form.recipientPlaceholder')}
          maxLength={100}
          returnKeyType="done"
        />
        <Controller
          control={control}
          name="giverPersonId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('donations.fields.giver')}
              options={personOptions}
              value={field.value ?? 0}
              onChange={(v) => field.onChange(v === 0 ? null : v)}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="paymentMethodId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('donations.fields.paymentMethod')}
              options={methodOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('donations.form.pick')}
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
          returnKeyType="done"
          onSubmitEditing={() => setFocus('recipient')}
        />
      </Card>

      {showFund ? <FundFields control={control} setValue={setValue} donation={donation} /> : null}

      <Button title={t('common.save')} loading={pending} onPress={submit} />
    </View>
  );
}

/** "Emanetten ver" anahtarı + emanet seçimi (emanet listesi yalnızca modül açıkken istenir). */
function FundFields({
  control,
  setValue,
  donation,
}: {
  control: Control<DonationFormValues>;
  setValue: UseFormSetValue<DonationFormValues>;
  donation?: DonationListItem;
}) {
  const { t } = useTranslation();
  const funds = useDonationFundsInfinite({ isClosed: false });
  const fromFund = useWatch({ control, name: 'useFund' });
  const fundId = useWatch({ control, name: 'fundId' });

  const openFunds = flattenPages(funds.data?.pages);
  const selectedFund = openFunds.find((f) => f.id === fundId);
  const fundOptions = openFunds
    .filter((f) => f.onHand > 0 || f.id === fundId)
    .map((f) => ({
      value: f.id,
      label: `${f.fromPersonName} · ${enumLabel('donationKind', f.kind)}`,
      description: t('donations.form.onHand', { amount: formatMoney(f.onHand) }),
    }));
  if (fundId != null && !fundOptions.some((o) => o.value === fundId) && donation?.fundLabel) {
    fundOptions.unshift({ value: fundId, label: donation.fundLabel, description: '' });
  }

  return (
    <>
      <Controller
        control={control}
        name="useFund"
        render={({ field }) => (
          <SwitchCard
            title={t('donations.form.fromFund')}
            description={
              selectedFund
                ? t('donations.form.onHand', { amount: formatMoney(selectedFund.onHand) })
                : t('donations.form.fromFundHint')
            }
            value={field.value}
            onChange={(on) => {
              field.onChange(on);
              if (!on) setValue('fundId', null);
            }}
          />
        )}
      />
      {fromFund ? (
        <Controller
          control={control}
          name="fundId"
          render={({ field, fieldState }) => (
            <SelectField<number>
              label={t('donations.fields.fund')}
              options={fundOptions}
              value={field.value}
              onChange={(id) => {
                field.onChange(id);
                // Emanetten dağıtılan bağış emanetle aynı türde olur.
                const fund = openFunds.find((f) => f.id === id);
                if (fund) setValue('kind', fund.kind, { shouldValidate: true });
              }}
              placeholder={t('donations.form.pick')}
              error={fieldState.error?.message}
              hint={t('donations.form.fundHint')}
              emptyText={t('donations.form.noFunds')}
            />
          )}
        />
      ) : null}
    </>
  );
}

const useStyles = makeStyles(() => ({
  container: { gap: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
}));
