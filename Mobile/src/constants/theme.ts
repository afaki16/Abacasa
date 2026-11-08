// Tasarım token'ları. Bileşenler renk/ölçüyü buradan alır; ekranlarda sabit renk yazma.
// Marka rengi logodan (abacasa mavisi); yazı rengi logodaki lacivert.

export const Colors = {
  primary: '#0A5BE8',
  primaryPressed: '#0847BE',
  onPrimary: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  borderFocus: '#0A5BE8',

  text: '#0B1F4D',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',

  danger: '#DC2626',
  dangerSurface: '#FEF2F2',
  success: '#16A34A',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const FontSize = {
  caption: 12,
  body: 15,
  label: 14,
  title: 20,
  heading: 26,
} as const;
