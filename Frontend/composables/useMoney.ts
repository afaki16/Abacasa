export const useMoney = () => {
  const formatters = new Map<string, Intl.NumberFormat>()

  const formatMoney = (amount: number | null | undefined, currency: 'TRY' | 'USD' = 'TRY'): string => {
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

  return { formatMoney }
}
