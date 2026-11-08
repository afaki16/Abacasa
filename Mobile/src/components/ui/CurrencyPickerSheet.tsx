import { useTranslation } from 'react-i18next';

import { Currency } from '@/lib/domain/enums';
import { formatAmount } from '@/lib/format/money';

import { SelectSheet, type SelectOption } from './SelectSheet';

const ALL: Currency[] = [Currency.TRY, Currency.USD, Currency.EUR, Currency.QuarterGold];
const SAMPLES: Record<Currency, number> = { TRY: 1234.56, USD: 250, EUR: 90, QuarterGold: 3 };
const LEADING: Record<Currency, string> = { TRY: '₺', USD: '$', EUR: '€', QuarterGold: 'Ç' };

export interface CurrencyPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  value: Currency;
  onSelect: (currency: Currency) => void;
  /** Kısıtlı liste (ör. kur ekranında yalnızca yabancı birimler). */
  currencies?: readonly Currency[];
}

/** Para birimi seçici (Bilesenler · 4): sembol, ad, örnek biçim; seçilide onay işareti. */
export function CurrencyPickerSheet({ visible, onClose, value, onSelect, currencies = ALL }: CurrencyPickerSheetProps) {
  const { t } = useTranslation();
  const options: SelectOption<Currency>[] = currencies.map((c) => ({
    value: c,
    leading: t(`ui.currency.symbol.${c}`, { defaultValue: LEADING[c] }),
    label: t(`enums.currency.${c}`),
    description:
      c === 'QuarterGold'
        ? `${formatAmount(SAMPLES[c], c)} · ${t('ui.currency.wholeNumber')}`
        : formatAmount(SAMPLES[c], c),
  }));

  return (
    <SelectSheet
      visible={visible}
      onClose={onClose}
      title={t('ui.currency.pickerTitle')}
      options={options}
      value={value}
      onSelect={onSelect}
      searchable={false}
    />
  );
}
