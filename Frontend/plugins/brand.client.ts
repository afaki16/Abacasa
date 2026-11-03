/**
 * Marka rengi: public/data.json → theme.colors.primary bir gradient ise
 * ([koyu, ana, açık] sırasıyla) açık temada "ana", koyu temada "açık" ton kullanılır.
 * --color-brand-light / --color-brand-dark değişkenlerine "r g b" olarak yazılır;
 * theme.css bunları tema primary'sine (--color-primary, --color-brand) bağlar.
 * UI kitindeki color="primary", Tailwind text-/bg-primary, çekmece başlığı, sekmeler bu rengi kullanır.
 *
 * Koyu temada renk koyu zeminde okunmalı: üçüncü ton ana renkten açık değilse
 * (ör. [#14532d, #166534, #064e3b]) ana renk beyaza doğru açılır.
 */
const toRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const triplet = (rgb: number[]) => rgb.map(Math.round).join(' ')
const luminance = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const lighten = (rgb: number[], amount: number) => rgb.map((c) => c + (255 - c) * amount)

export default defineNuxtPlugin(async () => {
  const { loadAppData, appData } = useAppData()
  await loadAppData()

  const primary = appData.value?.theme?.colors?.primary
  if (typeof primary !== 'string' || !primary.includes('gradient')) return

  const hexes = primary.match(/#[a-fA-F0-9]{6}/g)
  if (!hexes || hexes.length < 2) return

  const main = toRgb(hexes[1])
  const third = hexes[2] ? toRgb(hexes[2]) : null
  const dark = third && luminance(third) > luminance(main) ? third : lighten(main, 0.45)

  const root = document.documentElement.style
  root.setProperty('--color-brand-light', triplet(main))
  root.setProperty('--color-brand-dark', triplet(dark))
})
