import { Currency } from '~/types'

// Birim etiketleri (tek yer): metinler i18n'de (currencies.*); çağrıldığı anda çevrilir
const CURRENCY_KEYS: Record<Currency, string> = {
  [Currency.TRY]: 'try',
  [Currency.USD]: 'usd',
  [Currency.EUR]: 'eur',
  [Currency.QuarterGold]: 'quarterGold',
}

export const translateCurrency = (currency: Currency): string => {
  const key = CURRENCY_KEYS[currency]
  return key ? String(useNuxtApp().$i18n.t(`currencies.${key}`)) : String(currency)
}

type MoneyCode = 'TRY' | 'USD' | 'EUR'

const moneyCodes: Partial<Record<Currency, MoneyCode>> = {
  [Currency.TRY]: 'TRY',
  [Currency.USD]: 'USD',
  [Currency.EUR]: 'EUR',
}

export const useMoney = () => {
  const formatters = new Map<string, Intl.NumberFormat>()
  const quarterFormatter = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

  const formatMoney = (amount: number | null | undefined, currency: MoneyCode = 'TRY'): string => {
    if (amount === null || amount === undefined) return '—'
    let formatter = formatters.get(currency)
    if (!formatter) {
      formatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
      })
      formatters.set(currency, formatter)
    }
    return formatter.format(amount)
  }

  // Tutar kendi biriminde: TL/Dolar/Euro para biçimi; çeyrek altın "{n} çeyrek" (Türkçe sayı, ondalıksız)
  const formatAmount = (amount: number | null | undefined, currency: Currency): string => {
    if (amount === null || amount === undefined) return '—'
    if (currency === Currency.QuarterGold) return String(useNuxtApp().$i18n.t('currencies.quarterCount', { n: quarterFormatter.format(amount) }, Math.abs(amount)))
    return formatMoney(amount, moneyCodes[currency] ?? 'TRY')
  }

  const currencyLabel = (currency: Currency) => translateCurrency(currency)

  // TL ve yabancı birimler tek satırda: "₺29.000,00 · $17.700,00 · 3 çeyrek"
  const formatOpenLine = (openTry: number, foreign: { currency: Currency; open: number }[]) =>
    [formatMoney(openTry), ...foreign.map((f) => formatAmount(f.open, f.currency))].join(' · ')

  return { formatMoney, formatAmount, currencyLabel, formatOpenLine }
}
