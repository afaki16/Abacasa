// Tasarım token'ları. Bileşenler renkleri useColors() / makeStyles() ile alır; ekranlarda sabit renk yazma.
// Değerler Claude Design bileşen sayfasından (Bilesenler: açık + koyu token'lar, rozetler, gezinme).
// Marka rengi logodan (abacasa mavisi), yazı rengi logodaki lacivert.

import { useMemo } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { usePreferencesStore } from '@/stores/preferencesStore';

/** Rozet türleri: durum her zaman metinle de verilir (yalnızca renge bağlı değil). */
export type BadgeVariant = 'paid' | 'pending' | 'overdue' | 'admin' | 'member' | 'info' | 'neutral';

export interface ColorPair {
  bg: string;
  fg: string;
}

export interface ThemeColors {
  primary: string;
  primaryPressed: string;
  /** Logodaki gradyanın açık ucu. */
  primaryGradient: string;
  onPrimary: string;
  /** Ana rengin yumuşak zemini (seçili çip, ikincil düğme basılı, para birimi çipi). */
  primarySoft: string;
  /** primarySoft üstündeki metin/ikon. */
  primarySoftText: string;
  /** Seçili çip / basılı ikincil düğme kenarı. */
  primarySoftBorder: string;
  /** İkincil düğme kenarı. */
  primaryOutline: string;

  /** Sayfa zemini. */
  background: string;
  /** Kart, alan, alttan sayfa zemini. */
  card: string;
  /** Hafif dolgu: basılı satır, salt okunur alan, nötr ikon kutusu. */
  surface: string;
  /** Segment kontrolünün oluğu. */
  track: string;
  /** Segment kontrolünün seçili parçası. */
  trackActive: string;
  /** Liste ikon kutusu zemini ve ikonu. */
  iconTile: string;
  iconTileText: string;
  /** Kart ve liste ayırıcı. */
  border: string;
  /** Form alanı, çip, arama kutusu kenarı. */
  fieldBorder: string;
  borderFocus: string;

  text: string;
  textMuted: string;
  /** Alan içi yer tutucu metin. */
  placeholder: string;
  /** Devre dışı metin ve ikincil ikonlar (ok işaretleri). */
  textDisabled: string;
  /** Devre dışı dolu düğme zemini ve metni. */
  disabledSurface: string;
  onDisabled: string;

  danger: string;
  dangerSurface: string;
  /** Dolu tehlike düğmesi (Sil). Koyu temada metin açık kırmızı, düğme zemini daha doygun. */
  dangerSolid: string;
  dangerPressed: string;
  onDanger: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  /** İkinci bilgi rengi (turkuaz): ana renkle yan yana duran özet kartlarını ayırır. */
  teal: string;
  tealSoft: string;
  /** Kart üstündeki turkuaz ikon. */
  tealText: string;

  tabBar: string;
  tabBarBorder: string;
  tabInactive: string;

  /** Ana özet kartı (Dönem toplamı). Koyu temada parlak mavi yerine koyu mavi. */
  summaryCard: string;
  onSummaryCard: string;
  summaryCardMuted: string;
  summaryCardDivider: string;

  /** Toast ve internet yok bandı (ters renkli yüzey). */
  inverseSurface: string;
  onInverse: string;
  inverseAction: string;
  inverseSuccess: string;
  inverseError: string;

  skeleton: string;
  skeletonSoft: string;
  /** Alttan sayfa tutamacı. */
  handle: string;
  switchOff: string;
  switchThumb: string;
  /** Modal arkası karartma. */
  scrim: string;
  shadow: string;

  badges: Record<BadgeVariant, ColorPair>;
}

export const lightColors: ThemeColors = {
  primary: '#0A5BE8',
  primaryPressed: '#0044E1',
  primaryGradient: '#0593FE',
  onPrimary: '#FFFFFF',
  primarySoft: '#E6EEFD',
  primarySoftText: '#0A4BC0',
  primarySoftBorder: '#9DB9F4',
  primaryOutline: '#C9D7F7',

  background: '#FAF8FF',
  card: '#FFFFFF',
  surface: '#F4F3F8',
  track: '#EEEDF4',
  trackActive: '#FFFFFF',
  iconTile: '#EEF2FB',
  iconTileText: '#0A5BE8',
  border: '#ECEBF3',
  fieldBorder: '#D9D8E4',
  borderFocus: '#0A5BE8',

  text: '#0B1F4D',
  textMuted: '#434756',
  placeholder: '#5A5F70',
  textDisabled: '#8A8EA0',
  disabledSurface: '#E3E4EC',
  onDisabled: '#5A5F70',

  danger: '#BA1A1A',
  dangerSurface: '#FBE9E9',
  dangerSolid: '#BA1A1A',
  dangerPressed: '#931313',
  onDanger: '#FFFFFF',
  success: '#16A34A',
  successSurface: '#E3F4E8',
  warning: '#FEA619',
  warningSurface: '#FFF3DC',
  teal: '#0D9488',
  tealSoft: '#E1F3F1',
  tealText: '#0D9488',

  tabBar: '#FFFFFF',
  tabBarBorder: '#ECEBF3',
  tabInactive: '#5A5F70',

  summaryCard: '#0A5BE8',
  onSummaryCard: '#FFFFFF',
  summaryCardMuted: '#DCE7FD',
  summaryCardDivider: 'rgba(255,255,255,0.18)',

  inverseSurface: '#0B1F4D',
  onInverse: '#FFFFFF',
  inverseAction: '#9DC3FF',
  inverseSuccess: '#6EE29A',
  inverseError: '#FF8A80',

  skeleton: '#E9EAF2',
  skeletonSoft: '#F0F0F6',
  handle: '#D5D4DF',
  switchOff: '#C9CBD6',
  switchThumb: '#FFFFFF',
  scrim: 'rgba(11,31,77,0.45)',
  shadow: '#0B1F4D',

  badges: {
    paid: { bg: '#E3F4E8', fg: '#15653A' },
    pending: { bg: '#FFF3DC', fg: '#7A4A00' },
    overdue: { bg: '#FBE9E9', fg: '#BA1A1A' },
    admin: { bg: '#E6EEFD', fg: '#0A4BC0' },
    member: { bg: '#E1F3F1', fg: '#0B6F66' },
    info: { bg: '#E1F3F1', fg: '#0B6F66' },
    neutral: { bg: '#EEEDF4', fg: '#434756' },
  },
};

export const darkColors: ThemeColors = {
  primary: '#0593FE',
  primaryPressed: '#3AA8FF',
  primaryGradient: '#0593FE',
  // Açık mavi zemin üstünde beyaz yazı AA'yı geçmez; lacivert.
  onPrimary: '#0B1326',
  primarySoft: '#13305E',
  primarySoftText: '#8CC4FF',
  primarySoftBorder: '#3B6AB0',
  primaryOutline: '#2F4E80',

  background: '#0B1326',
  card: '#1E293B',
  surface: '#172135',
  track: '#111C33',
  trackActive: '#2C3A52',
  iconTile: '#13305E',
  iconTileText: '#8CC4FF',
  border: '#2C3A52',
  fieldBorder: '#3A4A66',
  borderFocus: '#0593FE',

  text: '#E8ECF6',
  textMuted: '#A3ACC2',
  placeholder: '#8A94AB',
  textDisabled: '#6B7590',
  disabledSurface: '#2C3A52',
  onDisabled: '#8A94AB',

  danger: '#FF8A80',
  dangerSurface: '#3D1518',
  dangerSolid: '#E5484D',
  dangerPressed: '#F2666A',
  onDanger: '#1A0506',
  success: '#6EE29A',
  successSurface: '#12371F',
  warning: '#FFC46B',
  warningSurface: '#3A2A0C',
  teal: '#14B8A6',
  tealSoft: '#123B39',
  tealText: '#5FD3C6',

  tabBar: '#111C33',
  tabBarBorder: '#24324A',
  tabInactive: '#A3ACC2',

  summaryCard: '#0F3A80',
  onSummaryCard: '#FFFFFF',
  summaryCardMuted: '#C9DBFB',
  summaryCardDivider: 'rgba(255,255,255,0.18)',

  inverseSurface: '#E8ECF6',
  onInverse: '#0B1F4D',
  inverseAction: '#0A4BC0',
  inverseSuccess: '#15803D',
  inverseError: '#BA1A1A',

  skeleton: '#24324A',
  skeletonSoft: '#1E293B',
  handle: '#3A4A66',
  switchOff: '#3A4A66',
  switchThumb: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.6)',
  shadow: '#000000',

  badges: {
    paid: { bg: '#12371F', fg: '#6EE29A' },
    pending: { bg: '#3A2A0C', fg: '#FFC46B' },
    overdue: { bg: '#3D1518', fg: '#FF8A80' },
    admin: { bg: '#13305E', fg: '#8CC4FF' },
    member: { bg: '#123B39', fg: '#7FD9CF' },
    info: { bg: '#123B39', fg: '#7FD9CF' },
    neutral: { bg: '#26334A', fg: '#A3ACC2' },
  },
};

/** Düz renk token'larının adları (badges gibi gruplar hariç): colors[token] her zaman string. */
export type ColorToken = { [K in keyof ThemeColors]: ThemeColors[K] extends string ? K : never }[keyof ThemeColors];

export type ColorSchemeName = 'light' | 'dark';

/** Etkin tema: kullanıcı tercihi (açık/koyu) ya da "sistem" ise cihazın teması. */
export function useColorSchemeName(): ColorSchemeName {
  const mode = usePreferencesStore((s) => s.themeMode);
  const system = useColorScheme();
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useColors(): ThemeColors {
  return useColorSchemeName() === 'dark' ? darkColors : lightColors;
}

/**
 * Temaya bağlı stil tanımı. Bileşen dışında bir kez tanımlanır, içinde hook olarak çağrılır:
 *   const useStyles = makeStyles((c) => ({ card: { backgroundColor: c.card } }));
 *   const styles = useStyles();
 * Stil nesnesi tema değişince yeniden oluşturulur (useMemo), her render'da değil.
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles<T>>(factory: (colors: ThemeColors) => T): () => T {
  return function useStyles() {
    const colors = useColors();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

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
  /** Düğme köşesi. */
  button: 14,
  lg: 16,
  xl: 20,
  /** Alttan sayfanın üst köşeleri. */
  sheet: 24,
  full: 999,
} as const;

/**
 * Inter ağırlık dosyaları (kök layout'ta useFonts ile yüklenir). Android'de fontWeight özel
 * fontta dosya değiştirmez; ağırlık her zaman fontFamily ile seçilir (Text bunu otomatik yapar).
 */
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** fontWeight → Inter dosyası. 300 ve altı regular, 800 ve üstü bold'a düşer. */
export function fontFamilyFor(weight: TextStyle['fontWeight'] | undefined): string {
  switch (String(weight ?? '400')) {
    case '500':
    case 'medium':
      return FontFamily.medium;
    case '600':
    case 'semibold':
      return FontFamily.semibold;
    case '700':
    case '800':
    case '900':
    case 'bold':
    case 'heavy':
    case 'black':
      return FontFamily.bold;
    default:
      return FontFamily.regular;
  }
}

export const FontSize = {
  caption: 12,
  label: 13,
  /** Sekme etiketi. */
  tab: 11,
  body: 15,
  /** Form alanı içindeki metin. */
  input: 16,
  section: 17,
  title: 20,
  heading: 26,
  amount: 44,
} as const;

/** Yazı ölçeği (Bilesenler · 2). Text bileşeninin varyantları bunlardır. */
export const Typography = {
  amountLarge: { fontFamily: FontFamily.bold, fontSize: 44, lineHeight: 52, fontVariant: ['tabular-nums'] },
  h1: { fontFamily: FontFamily.bold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26 },
  section: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 22 },
  bodyStrong: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

/** Basılabilir öğelerin en küçük dokunma alanı. */
export const MIN_TOUCH = 44;
