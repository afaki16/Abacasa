// Dönem hesapları. Tüm hesaplar UTC ile yapılır (saat dilimi kayması yok);
// tarihler 'YYYY-MM-DD' string olarak döner. Ay parametreleri 1–12.

export interface Period {
  start: string
  end: string
  /** Dönemin adlandırıldığı yıl/ay (kart döneminde kesim tarihinin ayı) */
  year: number
  month: number
}

const pad = (n: number) => String(n).padStart(2, '0')

const toIso = (utcMs: number): string => {
  const d = new Date(utcMs)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate()

/** Ayı ±n kaydırır */
export const addMonths = (year: number, month: number, n: number): { year: number; month: number } => {
  const d = new Date(Date.UTC(year, month - 1 + n, 1))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}

/** Ayın 1'i – son günü */
export const monthRange = (year: number, month: number): Period => ({
  start: toIso(Date.UTC(year, month - 1, 1)),
  end: toIso(Date.UTC(year, month - 1, daysInMonth(year, month))),
  year,
  month,
})

/**
 * Kart dönemi; kesim tarihinin ayıyla adlandırılır.
 * end = o ayın min(statementDay, ayın gün sayısı) günü
 * start = bir önceki ayın min(statementDay, o ayın gün sayısı) gününün ertesi günü
 */
export const statementPeriod = (year: number, month: number, statementDay: number): Period => {
  const endDay = Math.min(statementDay, daysInMonth(year, month))
  const prev = addMonths(year, month, -1)
  const prevEndDay = Math.min(statementDay, daysInMonth(prev.year, prev.month))
  return {
    start: toIso(Date.UTC(prev.year, prev.month - 1, prevEndDay + 1)),
    end: toIso(Date.UTC(year, month - 1, endDay)),
    year,
    month,
  }
}

/** Bugünü ('YYYY-MM-DD') içeren kart dönemi */
export const currentStatementPeriod = (today: string, statementDay: number): Period => {
  const [y, m, d] = today.split('-').map(Number)
  const endDay = Math.min(statementDay, daysInMonth(y, m))
  if (d <= endDay) return statementPeriod(y, m, statementDay)
  const next = addMonths(y, m, 1)
  return statementPeriod(next.year, next.month, statementDay)
}

/** Kullanıcının yerel takvimine göre bugün ('YYYY-MM-DD') */
export const todayIso = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** 'YYYY-MM-DD' → 'dd.MM.yyyy' */
export const formatDisplayDate = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}
