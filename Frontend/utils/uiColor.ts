/**
 * UI kitinin `color` prop'u için renk çözümleyici (Vuetify'ın color prop'unun karşılığı).
 * Tema adları CSS değişkenlerine bağlanır, böylece koyu temada otomatik değişir.
 * Bilinmeyen değer olduğu gibi CSS rengi kabul edilir ("#123456", "rgb(...)").
 *
 * - primary: data.json'daki marka rengi (--color-brand, bkz. plugins/brand.client.ts)
 * - success: tema primary'si (Vuetify temasında da success = primary idi)
 */
const NAMED: Record<string, string> = {
  primary: 'rgb(var(--color-brand))',
  secondary: 'rgb(var(--color-secondary))',
  error: 'rgb(var(--color-error))',
  success: 'rgb(var(--color-primary))',
  info: '#3b82f6',
  warning: '#fea619',
  white: '#ffffff',
  black: '#000000',
  orange: '#ff9800',
  'deep-purple': '#673ab7',
  grey: '#9e9e9e',
  'grey-lighten-1': '#bdbdbd',
  'grey-lighten-3': '#eeeeee',
  'grey-400': '#bdbdbd',
}

export const uiColor = (color?: string | null): string | undefined => {
  if (!color) return undefined
  const key = color.trim()
  return NAMED[key] ?? key
}
