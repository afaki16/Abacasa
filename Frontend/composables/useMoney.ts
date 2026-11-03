import { Currency } from '~/types'

// Birim etiketleri (tek yer)
export const CURRENCY_LABELS: Record<Currency, string> = {
  [Currency.TRY]: 'TL',
  [Currency.USD]: 'Dolar',
  [Currency.EUR]: 'Euro',
  [Currency.QuarterGold]: 'Çeyrek altın',
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
    if (currency === Currency.QuarterGold) return `${quarterFormatter.format(amount)} çeyrek`
    return formatMoney(amount, moneyCodes[currency] ?? 'TRY')
  }

  const currencyLabel = (currency: Currency) => CURRENCY_LABELS[currency] ?? String(currency)

  // TL ve yabancı birimler tek satırda: "₺29.000,00 · $17.700,00 · 3 çeyrek"
  const formatOpenLine = (openTry: number, foreign: { currency: Currency; open: number }[]) =>
    [formatMoney(openTry), ...foreign.map((f) => formatAmount(f.open, f.currency))].join(' · ')

  return { formatMoney, formatAmount, currencyLabel, formatOpenLine }
}
